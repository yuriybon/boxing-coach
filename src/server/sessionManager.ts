import { WebSocket } from "ws";
import { GoogleGenAI, Modality, LiveServerMessage, ActivityHandling, MediaResolution } from "@google/genai";

export class SessionManager {
  private ws: WebSocket;
  private genAI: GoogleGenAI;
  private currentSession: any | null = null;
  private transcript: { speaker: string; text: string; timestamp: number }[] = [];

  constructor(ws: WebSocket, genAI: GoogleGenAI) {
    this.ws = ws;
    this.genAI = genAI;
  }

  async startSession(config: any) {
    if (this.currentSession) {
      await this.currentSession.close();
    }

    try {
      console.log("Starting Gemini Session with config:", JSON.stringify({
        voice: config.voiceName,
        tools: config.tools ? config.tools.length : 0
      }));

      this.currentSession = await this.genAI.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName || "Zephyr" } },
          },
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
          realtimeInputConfig: {
            activityHandling: ActivityHandling.START_OF_ACTIVITY_INTERRUPTS
          },
          systemInstruction: config.systemInstruction,
          tools: config.tools || [],
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => this.handleMessage(message),
          onerror: (err) => this.handleError(err),
          onclose: () => this.handleClose(),
          // @ts-ignore
          ontoolcall: (toolCall) => this.handleToolCall(toolCall),
        }
      });
    } catch (error: any) {
      console.error("Failed to start session:", error);
      this.ws.send(JSON.stringify({ type: "error", message: "Failed to start session: " + error.message }));
    }
  }

  private handleToolCall(toolCall: any) {
    console.log("Forwarding tool call to client:", JSON.stringify(toolCall));
    this.ws.send(JSON.stringify({
      type: 'toolCall', // Matches what the client expects
      toolCall: toolCall
    }));
  }

  public async sendToolResponse(toolResponses: any[]) {
    if (this.currentSession) {
      try {
        await this.currentSession.sendToolResponse({ functionResponses: toolResponses });
      } catch (e) {
        console.error("Error sending tool response to Gemini:", e);
      }
    }
  }

  private handleMessage(message: LiveServerMessage) {
    const parts = message.serverContent?.modelTurn?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData?.data) {
        this.ws.send(JSON.stringify({ type: "audio", data: part.inlineData.data }));
      }
      if (part.text) {
        this.transcript.push({
          speaker: "Coach",
          text: part.text,
          timestamp: Date.now()
        });
        // Optional: Send text to client if needed
        this.ws.send(JSON.stringify({ type: "text", text: part.text }));
      }
    }
    
    if (message.serverContent?.interrupted) {
      this.ws.send(JSON.stringify({ type: "interrupted" }));
      this.transcript.push({
        speaker: "User",
        text: "[INTERRUPTION/SPEECH DETECTED]",
        timestamp: Date.now()
      });
    }
  }

  private handleError(err: any) {
    console.error("Gemini Error:", err);
    this.ws.send(JSON.stringify({ type: "error", message: err.message }));
  }

  private handleClose() {
    console.log("Gemini connection closed");
  }

  public async sendRealtimeInput(media: any) {
    if (this.currentSession) {
        try {
            await this.currentSession.sendRealtimeInput({ media });
        } catch (e) {
            console.error("Error sending realtime input:", e);
        }
    }
  }

  public async close() {
    if (this.currentSession) {
      this.currentSession.close();
    }
  }
}
