import { WebSocket } from "ws";
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { CONCIERGE_SYS_INSTRUCT, CONCIERGE_TOOLS, COACH_SYS_INSTRUCT_TEMPLATE, STATS_SYS_INSTRUCT } from "./prompts";

export class SessionManager {
  private ws: WebSocket;
  private genAI: GoogleGenAI;
  private currentSession: any | null = null;
  private transcript: { speaker: string; text: string; timestamp: number }[] = [];
  private startTime: number = 0;
  private sessionContext: { injuries: string; energy: string; focus: string } | null = null;

  constructor(ws: WebSocket, genAI: GoogleGenAI) {
    this.ws = ws;
    this.genAI = genAI;
  }

  async start() {
    await this.startConciergeSession();
  }

  async startHardTraining() {
    console.log("Starting Hard Training Session (Manual Override)");
    await this.startCoachSession({
      injuries: "None",
      energy: "High (Hard Mode)",
      focus: "Intensity & Power"
    });
  }

  private async startConciergeSession() {
    try {
      this.currentSession = await this.genAI.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: CONCIERGE_SYS_INSTRUCT,
          tools: CONCIERGE_TOOLS,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => this.handleMessage(message),
          onerror: (err) => this.handleError(err),
          onclose: () => this.handleClose(),
          // @ts-ignore - The SDK types might differ slightly, but this is the standard pattern for tools
          ontoolcall: (toolCall) => this.handleToolCall(toolCall),
        }
      });
    } catch (error) {
      console.error("Failed to start Concierge session:", error);
      this.ws.send(JSON.stringify({ type: "error", message: "Failed to start session" }));
    }
  }

  private async startCoachSession(context: { injuries: string; energy: string; focus: string }) {
    if (this.currentSession) {
      await this.currentSession.close();
    }

    this.sessionContext = context;
    this.startTime = Date.now();

    try {
      const systemInstruction = COACH_SYS_INSTRUCT_TEMPLATE(context);
      
      this.currentSession = await this.genAI.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => this.handleMessage(message),
          onerror: (err) => this.handleError(err),
          onclose: () => this.handleClose(),
        }
      });
      
      // Notify frontend of state change (optional, but good for UI)
      this.ws.send(JSON.stringify({ type: "mode_change", mode: "coach" }));
      
    } catch (error) {
      console.error("Failed to start Coach session:", error);
      this.ws.send(JSON.stringify({ type: "error", message: "Failed to switch to coach" }));
    }
  }

  private async handleToolCall(toolCall: any) {
    console.log("Tool call received:", JSON.stringify(toolCall, null, 2));
    
    // Check if it's the plan_session function
    // The structure might vary slightly depending on SDK version, 
    // but typically it's an array of functionCalls
    const functionCalls = toolCall.functionCalls;
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "plan_session") {
        const args = call.args as { injuries: string; energy: string; focus: string };
        await this.startCoachSession(args);
        
        // We might need to send a tool response back to the model to acknowledge completion,
        // but since we are closing the session immediately, it might not be strictly necessary 
        // for the *old* session. However, standard practice implies we should return something if we stayed.
        // Here we are hard-switching.
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
    
    if (this.transcript.length > 0 && this.sessionContext) {
      console.log("Generating session stats...");
      const stats = await this.generateStats();
      if (stats) {
        console.log("SESSION STATS GENERATED:", JSON.stringify(stats, null, 2));
      }
    }
  }

  private async generateStats() {
    try {
      const prompt = `
      ${STATS_SYS_INSTRUCT}
      
      SESSION CONTEXT:
      ${JSON.stringify(this.sessionContext, null, 2)}
      
      TRANSCRIPT:
      ${this.transcript.map(t => `[${new Date(t.timestamp).toISOString()}] ${t.speaker}: ${t.text}`).join('\n')}
      `;

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      if (!result.text) {
        throw new Error("No text returned from Gemini");
      }

      return JSON.parse(result.text);
    } catch (error) {
      console.error("Failed to generate stats:", error);
      return null;
    }
  }
}