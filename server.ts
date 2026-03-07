import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = 3000;

  // 1. API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 2. WebSocket Server for Gemini Live API
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    if (req.url !== "/ws/coach") {
      ws.close();
      return;
    }

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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
