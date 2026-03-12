import { Type } from "@google/genai";
import { Mic, Play, Square } from "lucide-react";
import { useState } from "react";
import { useGeminiLive } from "../lib/useGeminiLive";
import { TRAINING_PLANS, TRAINER_PERSONALITIES, TrainingConfig } from "../store";

interface ConciergeProps {
  onStartRound: (config?: TrainingConfig) => void;
}

export function Concierge({ onStartRound }: ConciergeProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [config, setConfig] = useState<TrainingConfig | null>(null);

  const { connect, disconnect, isConnected, isConnecting, sendToolResponse } =
    useGeminiLive({
      systemInstruction: `You are a professional, high-energy athletic coordinator. Your goal is to quickly extract the information required to generate a training session plan. 
    Start with a single-sentence greeting. 
    If the athlete already provides specific training details, immediately call the 'setTrainingConfig' tool without asking additional questions. 
    If the athlete is unsure, guide them with a few focused questions to determine: training intensity, preferred trainer personality, desired combo complexity, and session duration or style. 
    
    You have a library of 3 trainer personalities:
    1. "hard-nosed" (The Hard-Nosed Veteran)
    2. "father-figure" (The Father Figure / Mentor)
    3. "barbie" (The Barbie Trainer / Supportive Sparkle)
    
    You have a library of 3 training plans:
    1. "rapid-fire" (The Rapid Fire: 1-2-3-2)
    2. "counter-striker" (The Counter-Striker: 1, Slip Right, 2, 3)
    3. "distance-closer" (Distance Closer: 1, 1, 2, 3)
    
    Based on the user's input, match their preferences to one of the trainer personalities and one of the training plans.
    Once you have matched them, call the 'setTrainingConfig' tool with the selected IDs. After calling the tool, say 'I have your session ready. Click Start Round when you are ready.' and stop asking questions.`,
      voiceName: "Zephyr",
      tools: [
        {
          functionDeclarations: [
            {
              name: "setTrainingConfig",
              description:
                "Sets the training configuration based on the user's preferences.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  trainerId: {
                    type: Type.STRING,
                    description:
                      "The ID of the selected trainer personality ('hard-nosed', 'father-figure', or 'barbie').",
                  },
                  planId: {
                    type: Type.STRING,
                    description:
                      "The ID of the selected training plan ('rapid-fire', 'counter-striker', or 'distance-closer').",
                  },
                  duration: {
                    type: Type.NUMBER,
                    description: "The duration of the session in seconds.",
                  },
                },
                required: ["trainerId", "planId", "duration"],
              },
            },
          ],
        },
      ],
      onMessage: (msg) => {
        if (msg.serverContent?.modelTurn) {
          // Handle text output if any (usually we just play audio, but we can log it)
        }

        if (msg.toolCall) {
          const calls = msg.toolCall.functionCalls;
          if (calls) {
            for (const call of calls) {
              if (call.name === "setTrainingConfig") {
                const args = call.args as any;
                const trainer = TRAINER_PERSONALITIES.find(t => t.id === args.trainerId) || TRAINER_PERSONALITIES[0];
                const plan = TRAINING_PLANS.find(p => p.id === args.planId) || TRAINING_PLANS[0];
                
                setConfig({
                  trainerId: trainer.id,
                  trainerName: trainer.name,
                  personality: trainer.prompt,
                  voiceName: trainer.voiceName,
                  planId: plan.id,
                  planName: plan.name,
                  plan: plan.plan,
                  duration: args.duration || 180,
                });
                sendToolResponse([
                  {
                    id: call.id,
                    name: call.name,
                    response: { status: "success" },
                  },
                ]);
              }
            }
          }
        }
      },
    });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Cornerman AI
          </h1>
          <p className="text-zinc-400">
            Your voice-first, multimodal AI boxing coach.
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
              Session Setup
            </div>

            <button
              onClick={isConnected ? disconnect : connect}
              disabled={isConnecting}
              className={`relative group flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${
                isConnected
                  ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                  : "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
              }`}
            >
              <div
                className={`absolute inset-0 rounded-full ${isConnected ? "animate-ping bg-red-500/20" : ""}`}
              />
              {isConnected ? (
                <Square className="w-8 h-8 fill-current" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
            <p className="text-sm text-zinc-400">
              {isConnecting
                ? "Connecting..."
                : isConnected
                  ? "Listening... (Tap to stop)"
                  : "Tap to speak with Concierge"}
            </p>
          </div>

          {config && (
            <div className="bg-zinc-800/50 rounded-xl p-4 text-left space-y-2 border border-zinc-700/50">
              <h3 className="font-semibold text-emerald-400 text-sm uppercase tracking-wider">
                Session Ready
              </h3>
              <p className="text-sm">
                <span className="text-zinc-400">Trainer:</span>{" "}
                {config.trainerName}
              </p>
              <p className="text-sm">
                <span className="text-zinc-400">Plan:</span> {config.planName}
              </p>
              <p className="text-sm">
                <span className="text-zinc-400">Duration:</span>{" "}
                {Math.floor(config.duration / 60)}m {config.duration % 60}s
              </p>
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={() => {
                disconnect();
                onStartRound(config || undefined);
              }}
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-4 px-8 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              <Play className="w-5 h-5 fill-current" />
              {config ? "Start Custom Round" : "Start Random Round"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
