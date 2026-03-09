import "dotenv/config";
import express from "express";
// import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import { OAuth2Client } from "google-auth-library";
import cookieSession from "cookie-session";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let secretClient: SecretManagerServiceClient | null = null;

async function getSecret(name: string): Promise<string | null> {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  
  if (!project || project === "your-project-id") {
    console.log(`[SecretManager] Skipping ${name}: GOOGLE_CLOUD_PROJECT is not set or is default.`);
    return null;
  }

  try {
    if (!secretClient) {
      console.log(`[SecretManager] Initializing client for project: ${project}`);
      // In Cloud Run, this will use the service account attached to the revision
      secretClient = new SecretManagerServiceClient();
    }

    const secretPath = `projects/${project}/secrets/${name}/versions/latest`;
    const [version] = await secretClient.accessSecretVersion({
      name: secretPath,
    });
    
    const payload = version.payload?.data?.toString();
    if (payload) {
      console.log(`[SecretManager] Successfully fetched: ${name}`);
      return payload.trim();
    }
    return null;
  } catch (error: any) {
    if (error.message?.includes("Could not load the default credentials") || error.code === 16) {
      console.error(`[SecretManager] AUTH ERROR: Could not find Application Default Credentials.`);
      console.error(`[SecretManager] ACTION REQUIRED: Run 'gcloud auth application-default login' in your terminal.`);
    } else if (error.code === 7) {
      console.error(`[SecretManager] PERMISSION DENIED: Your account doesn't have access to secret '${name}'.`);
      console.error(`[SecretManager] ACTION REQUIRED: Grant 'Secret Manager Secret Accessor' role to your identity in Google Cloud Console.`);
    } else if (error.code === 5) {
      console.warn(`[SecretManager] NOT FOUND: Secret '${name}' does not exist in project '${project}'.`);
    } else {
      console.warn(`[SecretManager] Error fetching ${name}:`, error.message);
    }
    return null;
  }
}

async function startServer() {
  // Load secrets from Secret Manager if they are not in process.env
  const secretsToLoad = [
    "GEMINI_API_KEY",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "SESSION_SECRET"
  ];

  console.log("--- Loading Configuration ---");
  console.log(`[Config] Project ID: ${process.env.GOOGLE_CLOUD_PROJECT || "NOT SET"}`);
  
  for (const secretName of secretsToLoad) {
    if (process.env[secretName]) {
      console.log(`[Config] ${secretName}: Loaded from Environment/.env`);
    } else {
      const value = await getSecret(secretName);
      if (value) {
        process.env[secretName] = value;
        console.log(`[Config] ${secretName}: Loaded from Google Secret Manager`);
      } else {
        console.warn(`[Config] ${secretName}: NOT FOUND (Environment or Secret Manager)`);
      }
    }
  }
  console.log("-----------------------------\n");

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  const app = express();
  
  // REQUIRED for cookies to work on Cloud Run / behind a proxy
  app.set("trust proxy", 1);

  const server = createServer(app);
  const PORT = process.env.PORT || 3000;

  // Centralized redirect URI logic
  const getRedirectUri = (req?: express.Request) => {
    if (process.env.APP_URL) {
      const baseUrl = process.env.APP_URL.replace(/\/$/, "");
      return `${baseUrl}/api/auth/google/callback`;
    }
    
    if (req) {
      // Cloud Run and other proxies set these headers
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers["host"];
      return `${protocol}://${host}/api/auth/google/callback`;
    }

    return `http://localhost:${PORT}/api/auth/google/callback`;
  };

  // Session configuration for AI Studio iframe
  const isProduction = process.env.NODE_ENV === "production";
  const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
  
  console.log(`[Config] Running in ${isProduction ? "PRODUCTION" : "DEVELOPMENT"} mode`);
  console.log(`[Config] Localhost detected: ${isLocalhost}. Cookies will be ${isLocalhost ? "INSECURE" : "SECURE"}.`);
  console.log(`[Config] SESSION_SECRET present: ${!!process.env.SESSION_SECRET}`);

  app.use((req, res, next) => {
    // Dynamically determine SameSite based on context
    // If we're in an iframe (like AI Studio), we need 'none'
    // If we're on mobile or direct access, 'lax' is more compatible
    const isIframe = req.headers["sec-fetch-dest"] === "iframe" || 
                     req.headers["referer"]?.includes("aistudio.google.com");
    
    const sameSite = isProduction && !isLocalhost 
      ? (isIframe ? "none" : "lax") 
      : "lax";

    cookieSession({
      name: "session",
      keys: [process.env.SESSION_SECRET || "boxing-coach-secret"],
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: isProduction && !isLocalhost,
      sameSite: sameSite as any,
      httpOnly: true,
      signed: true,
      // @ts-ignore - partitioned is supported in modern browsers for cross-site cookies
      partitioned: isProduction && !isLocalhost && sameSite === "none",
    })(req, res, next);
  });

  // 1. API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth Routes
  app.get("/api/auth/google/url", (req, res) => {
    const redirectUri = getRedirectUri(req);
    console.log(`[Auth] Generating Auth URL with redirect_uri: ${redirectUri}`);
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
      redirect_uri: redirectUri,
    });
    res.json({ url });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const redirectUri = getRedirectUri(req);
    console.log(`[Auth] Handling callback with redirect_uri: ${redirectUri}`);
    
    if (!code) {
      return res.status(400).send("No code provided");
    }

    try {
      console.log(`[Auth] Attempting token exchange for code: ${code.toString().substring(0, 10)}...`);
      console.log(`[Auth] Using Client ID: ${process.env.GOOGLE_CLIENT_ID?.substring(0, 10)}...`);
      console.log(`[Auth] Client Secret Length: ${process.env.GOOGLE_CLIENT_SECRET?.length || 0}`);
      
      const { tokens } = await oauth2Client.getToken({
        code: code as string,
        redirect_uri: redirectUri,
      });
      
      console.log("[Auth] Token exchange successful");
      oauth2Client.setCredentials(tokens);
      
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      
      if (req.session) {
        req.session.user = {
          id: payload?.sub,
          name: payload?.name,
          email: payload?.email,
          picture: payload?.picture,
        };
      }

      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.send(`
        <html>
          <head>
            <title>Authentication Successful</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #09090b; color: white; }
              .card { background: #18181b; padding: 2.5rem; border-radius: 24px; border: 1px solid #27272a; text-align: center; max-width: 90%; width: 400px; }
              .icon { width: 64px; height: 64px; background: #10b98120; color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 32px; }
              h2 { margin: 0 0 0.5rem; font-weight: 800; letter-spacing: -0.025em; }
              p { color: #a1a1aa; margin-bottom: 2rem; line-height: 1.5; }
              .btn { background: white; color: black; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.05em; }
              .btn:hover { background: #e4e4e7; transform: translateY(-1px); }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">✓</div>
              <h2>Success!</h2>
              <p>You've successfully signed in to Cornerman AI. You can now close this window and start training.</p>
              <a href="/" class="btn" id="action-btn">Return to App</a>
            </div>
            <script>
              // 1. Try to notify the parent window (if it's a popup)
              if (window.opener) {
                try {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                  // If we have an opener, we can try to close
                  setTimeout(() => {
                    window.close();
                  }, 1500);
                } catch (e) {
                  console.error("Failed to postMessage to opener:", e);
                }
              } else {
                // 2. If no opener (common on mobile), change button text
                document.getElementById('action-btn').innerText = 'Open App';
              }
            </script>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("[Auth] Token exchange failed detail:");
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("Message:", error.message);
      }
      res.status(500).send("Authentication failed. Check server logs for details.");
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const user = req.session?.user || null;
    console.log(`[Auth] /api/auth/me called. User in session: ${user ? user.email : "NONE"}`);
    res.json({ user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

import { SessionManager } from "./src/server/sessionManager";

  // 2. WebSocket Server for Gemini Live API
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    if (req.url !== "/ws/coach") {
      ws.close();
      return;
    }

    console.log("Client connected to /ws/coach");
    const sessionManager = new SessionManager(ws, ai);

    try {
      await sessionManager.start();

      // Handle incoming messages from frontend (audio/video frames)
      ws.on("message", async (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "realtime_input") {
            await sessionManager.sendRealtimeInput(msg.media);
          }
        } catch (e) {
          console.error("Error processing WS message:", e);
        }
      });

      ws.on("close", () => {
        console.log("Client disconnected");
        sessionManager.close();
      });

    } catch (err: any) {
      console.error("Failed to connect to Gemini:", err);
      ws.send(JSON.stringify({ type: "error", message: err.message || "Failed to connect to Gemini" }));
      ws.close();
    }
  });

  // 3. Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist in production
    app.use(express.static(path.join(__dirname, "dist")));
    
    // Catch-all route to serve index.html for SPA
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
