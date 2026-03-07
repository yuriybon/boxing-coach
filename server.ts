import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
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
  try {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    if (!project || project === "your-project-id") {
      return null;
    }

    if (!secretClient) {
      secretClient = new SecretManagerServiceClient();
    }

    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${project}/secrets/${name}/versions/latest`,
    });
    const payload = version.payload?.data?.toString();
    return payload?.trim() || null;
  } catch (error: any) {
    // Specifically catch authentication errors to provide better guidance
    if (error.message?.includes("Could not load the default credentials") || error.code === 16) {
      console.warn(`[Auth] Google Cloud credentials not found. Skipping Secret Manager for ${name}. Run 'gcloud auth application-default login' to fix this.`);
    } else {
      console.warn(`[SecretManager] Could not fetch secret ${name}:`, error.message);
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
  const server = createServer(app);
  const PORT = process.env.PORT || 3000;

  // Centralized redirect URI logic
  const getRedirectUri = () => {
    const baseUrl = process.env.APP_URL?.replace(/\/$/, "") || `http://localhost:${PORT}`;
    return `${baseUrl}/api/auth/google/callback`;
  };

  // Session configuration for AI Studio iframe
  app.use(
    cookieSession({
      name: "session",
      keys: [process.env.SESSION_SECRET || "boxing-coach-secret"],
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: true,
      sameSite: "none",
      httpOnly: true,
    })
  );

  // 1. API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth Routes
  app.get("/api/auth/google/url", (req, res) => {
    const redirectUri = getRedirectUri();
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
    const redirectUri = getRedirectUri();
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

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
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
    res.json({ user: req.session?.user || null });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

  // 2. WebSocket Server for Gemini Live API
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    if (req.url !== "/ws/coach") {
      ws.close();
      return;
    }

    // Simple session check for WebSocket (requires parsing cookie from handshake)
    // For this demo, we'll assume the client will handle auth state, 
    // but in production you'd verify the session cookie here.
    
    console.log("Client connected to /ws/coach");
    let session: any = null;

    try {
      // Connect to Gemini Live API securely on the backend
      session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are Cornerman AI, a tough, motivating, and expert boxing coach. You are watching the user train on a punch bag or shadow boxing. Call out combinations (e.g., 'Jab, cross, hook!', '1, 2, 3!'). Watch their form and provide real-time feedback. Listen to their breathing and punches. If they stop, motivate them. Keep your responses short, punchy, and actionable. Adapt if they interrupt you.",
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            // Forward audio to frontend
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              ws.send(JSON.stringify({ type: "audio", data: base64Audio }));
            }
            
            // Forward interruptions to frontend
            if (message.serverContent?.interrupted) {
              ws.send(JSON.stringify({ type: "interrupted" }));
            }
          },
          onerror: (err) => {
            console.error("Gemini Error:", err);
            ws.send(JSON.stringify({ type: "error", message: err.message }));
          },
          onclose: () => {
            console.log("Gemini connection closed");
            ws.close();
          }
        }
      });

      // Handle incoming messages from frontend (audio/video frames)
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "realtime_input" && session) {
            session.sendRealtimeInput({ media: msg.media });
          }
        } catch (e) {
          console.error("Error parsing WS message:", e);
        }
      });

      ws.on("close", () => {
        console.log("Client disconnected");
        if (session) session.close();
      });

    } catch (err: any) {
      console.error("Failed to connect to Gemini:", err);
      ws.send(JSON.stringify({ type: "error", message: err.message || "Failed to connect to Gemini" }));
      ws.close();
    }
  });

  // 3. Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
