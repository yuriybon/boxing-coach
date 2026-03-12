import { Camera, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useGeminiLive } from "../lib/useGeminiLive";
import { TrainingConfig, SessionStats } from "./store";

interface TrainingProps {
  config: TrainingConfig;
  onFinish: (stats: SessionStats) => void;
}

export function Training({ config, onFinish }: TrainingProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const startTimeRef = useRef<number>(0);

  const { connect, disconnect, isConnected, isConnecting, sendVideoFrame } =
    useGeminiLive({
      systemInstruction: config.systemInstructionOverride || `IMPORTANT: Your goal is to run the full training plan from beginning to end.
    
    TRAINING PLAN: ${config.plan}
    TRAINER PERSONALITY: ${config.personality}
    
    WHEN you see instruction <time to comment: ...>
    Say a brief motivational or corrective comment in your coaching style.
    
    IF you see on video that the fighter drops their guard repeatedly
    Tell them to keep their guard up in your coaching style.
    
    IF you hear silence or inactivity for a long time
    Encourage the fighter to keep punching.
    
    IF the user interrupts you
    Respond in one sentence, then continue executing the training plan.
    
    Start the round immediately by announcing the plan and telling them to get ready.`,
      voiceName: config.voiceName, // A different voice for the trainer
    });

  // Start webcam
  useEffect(() => {
    let stream: MediaStream;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Camera error:", err));

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Video frame streaming loop
  useEffect(() => {
    if (!isConnected || !isRoundActive) return;

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64Data = canvas.toDataURL("image/jpeg", 0.5).split(",")[1];
          sendVideoFrame(base64Data);
        }
      }
    }, 2000); // Send a frame every 2 seconds

    return () => clearInterval(interval);
  }, [isConnected, isRoundActive, sendVideoFrame]);

  // Timer
  useEffect(() => {
    if (!isRoundActive) return;

    if (timeLeft <= 0) {
      handleStop();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRoundActive, timeLeft]);

  const handleStart = () => {
    connect();
    setIsRoundActive(true);
    startTimeRef.current = Date.now();
  };

  const handleStop = () => {
    disconnect();
    setIsRoundActive(false);
    
    const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
    
    // Simulate some stats since we don't have real sensors yet
    // In a real app, these would come from the backend analysis or wearable data
    const estimatedPunches = Math.floor(durationSeconds * 0.8); // Approx 0.8 punches per second
    const estimatedCalories = Math.floor(durationSeconds * 0.15); // Approx 9 calories per minute

    onFinish({
      durationSeconds,
      punchesThrown: estimatedPunches,
      caloriesBurned: estimatedCalories,
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Live Training</h2>
            <p className="text-zinc-400 text-sm">{config.trainerName}</p>
          </div>
          <div className="text-4xl font-mono font-bold text-emerald-400 tracking-wider">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute top-4 right-4 flex gap-2">
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${isConnected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-zinc-800 text-zinc-400"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`}
              />
              LIVE AI
            </div>
            <div className="px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 text-xs font-semibold backdrop-blur-sm flex items-center gap-2 border border-zinc-700/50">
              <Camera className="w-3 h-3" />
              VISION
            </div>
            <div className="px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 text-xs font-semibold backdrop-blur-sm flex items-center gap-2 border border-zinc-700/50">
              <Mic className="w-3 h-3" />
              AUDIO
            </div>
          </div>

          {!isRoundActive && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <button
                onClick={handleStart}
                disabled={isConnecting}
                className="bg-emerald-500 text-black font-bold text-lg px-8 py-4 rounded-full hover:bg-emerald-400 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
              >
                {isConnecting ? "Connecting..." : "START ROUND"}
              </button>
            </div>
          )}
        </div>

        {isRoundActive && (
          <div className="flex justify-center">
            <button
              onClick={handleStop}
              className="group flex items-center gap-2 bg-red-500/10 text-red-500 font-semibold px-6 py-3 rounded-full hover:bg-red-500/20 transition-colors border border-red-500/20"
            >
              <Square className="w-4 h-4 fill-current" />
              End Round Early
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
