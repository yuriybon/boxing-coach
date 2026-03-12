import { Activity, ShieldAlert, Timer, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useGeminiLive } from "../lib/useGeminiLive";
import { TrainingConfig } from "../store";

interface AnalysisProps {
  config: TrainingConfig;
  onRestart: () => void;
}

export function Analysis({ config, onRestart }: AnalysisProps) {
  const [timeLeft, setTimeLeft] = useState(60); // 60-second break

  const [hasStarted, setHasStarted] = useState(false);

  const { connect, disconnect, isConnected, isConnecting } = useGeminiLive({
    systemInstruction: `You are an elite AI Boxing Cornerman and Analytics Agent speaking to your fighter during a 60-second break between rounds.
    
    The fighter just completed a round with the following plan: ${config.plan}.
    
    Your job is to deliver clear, actionable feedback based on biomechanical observations and audio/video data from the previous round.
    Focus on:
    - guard discipline
    - punch activity
    - rhythm and pace
    - moments of hesitation
    - combo execution.
    
    Be concise, highly analytical, and motivational. Start speaking immediately to give them their corner advice.`,
    voiceName: "Fenrir", // A different voice for the analyst
  });

  useEffect(() => {
    return () => disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    if (timeLeft <= 0) {
      disconnect();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [hasStarted, timeLeft, disconnect]);

  const handleStart = () => {
    setHasStarted(true);
    connect();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Corner Break
          </h2>
          <p className="text-zinc-400">
            Analysis Agent is reviewing your performance...
          </p>
        </div>

        <div className="flex justify-center">
          {!hasStarted ? (
            <button
              onClick={handleStart}
              disabled={isConnecting}
              className="bg-emerald-500 text-black font-bold text-lg px-8 py-4 rounded-full hover:bg-emerald-400 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
            >
              {isConnecting ? "Connecting..." : "START ANALYSIS"}
            </button>
          ) : (
            <div className="relative flex items-center justify-center w-48 h-48 rounded-full border-4 border-zinc-800 bg-zinc-900 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
              <div
                className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"
                style={{ animationDuration: "3s" }}
              />
              <div className="text-5xl font-mono font-bold text-emerald-400">
                {formatTime(timeLeft)}
              </div>
              <div className="absolute bottom-8 text-xs font-semibold text-zinc-500 tracking-widest uppercase">
                Rest
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-full">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">85%</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                Guard Uptime
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
            <div className="p-3 bg-orange-500/10 text-orange-400 rounded-full">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">142</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                Punches Thrown
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-full">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">280ms</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                Avg Reaction
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">92%</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                Pace Consistency
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Live AI Feedback
            </h3>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${isConnected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-zinc-800 text-zinc-400"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`}
              />
              {isConnecting
                ? "CONNECTING..."
                : isConnected
                  ? "LISTENING..."
                  : "OFFLINE"}
            </div>
          </div>
          <div className="h-32 flex items-center justify-center border border-zinc-800/50 rounded-xl bg-zinc-950/50">
            {isConnected ? (
              <div className="flex gap-1 items-center h-8">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-emerald-500 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Waiting for connection...</p>
            )}
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              disconnect();
              onRestart();
            }}
            className="bg-white text-black font-semibold px-8 py-4 rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Finish & Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
