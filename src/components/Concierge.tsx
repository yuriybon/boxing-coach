import { Play, User, Dumbbell, Clock, Zap } from "lucide-react";
import { useState } from "react";
import { TRAINING_PLANS, TRAINER_PERSONALITIES, TrainingConfig } from "./store";

interface ConciergeProps {
  onStartRound: (config: TrainingConfig) => void;
}

export function Concierge({ onStartRound }: ConciergeProps) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(TRAINER_PERSONALITIES[0].id);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(TRAINING_PLANS[0].id);
  const [duration, setDuration] = useState<number>(180); // Default 3 minutes

  const handleStart = () => {
    const trainer = TRAINER_PERSONALITIES.find((t) => t.id === selectedTrainerId)!;
    const plan = TRAINING_PLANS.find((p) => p.id === selectedPlanId)!;

    const config: TrainingConfig = {
      trainerId: trainer.id,
      trainerName: trainer.name,
      personality: trainer.prompt,
      voiceName: trainer.voiceName,
      planId: plan.id,
      planName: plan.name,
      plan: plan.plan,
      duration: duration,
    };

    onStartRound(config);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 font-sans selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
            Setup <span className="text-emerald-500">Session</span>
          </h1>
          <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider">
            Select your coach and your mission.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Selection */}
          <div className="flex flex-col gap-10">
            
            {/* Trainer Selection */}
            <section>
              <div className="flex items-center gap-2 mb-4 text-emerald-500">
                <User className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-wider text-sm">Choose Your Coach</h2>
              </div>
              <div className="grid gap-3">
                {TRAINER_PERSONALITIES.map((trainer) => (
                  <button
                    key={trainer.id}
                    onClick={() => setSelectedTrainerId(trainer.id)}
                    className={`text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                      selectedTrainerId === trainer.id
                        ? "bg-zinc-900 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                        : "bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <div className={`font-bold text-lg mb-1 ${selectedTrainerId === trainer.id ? 'text-white' : 'text-zinc-300'}`}>
                          {trainer.name}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono uppercase tracking-wide">
                          Voice: {trainer.voiceName}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedTrainerId === trainer.id ? 'border-emerald-500' : 'border-zinc-700'
                      }`}>
                         {selectedTrainerId === trainer.id && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Plan Selection */}
            <section>
              <div className="flex items-center gap-2 mb-4 text-emerald-500">
                <Dumbbell className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-wider text-sm">Select Training Plan</h2>
              </div>
              <div className="grid gap-3">
                {TRAINING_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                      selectedPlanId === plan.id
                        ? "bg-zinc-900 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                        : "bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                         <div className={`font-bold text-lg mb-1 ${selectedPlanId === plan.id ? 'text-white' : 'text-zinc-300'}`}>
                          {plan.name.split(":")[0]}
                        </div>
                        <div className="text-sm text-zinc-400">
                           {plan.name.split(":")[1] || "Focus on technique and power"}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-4 ${
                        selectedPlanId === plan.id ? 'border-emerald-500' : 'border-zinc-700'
                      }`}>
                         {selectedPlanId === plan.id && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

             {/* Duration Selection */}
             <section>
              <div className="flex items-center gap-2 mb-4 text-emerald-500">
                <Clock className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-wider text-sm">Round Duration</h2>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-3xl font-bold font-mono text-white">
                    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">
                    Minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="600"
                  step="30"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                />
                <div className="flex justify-between text-xs text-zinc-600 font-mono mt-2">
                  <span>30s</span>
                  <span>10m</span>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column: Preview & Action */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-12 h-fit">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-8 rounded-3xl flex flex-col gap-6 shadow-2xl relative overflow-hidden">
               {/* Decorative background elements */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
               
               <div>
                  <h3 className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-2">Session Preview</h3>
                  <div className="text-3xl font-bold text-white mb-1">
                    {TRAINER_PERSONALITIES.find(t => t.id === selectedTrainerId)?.name}
                  </div>
                  <div className="text-emerald-400 font-medium">
                     Running "{TRAINING_PLANS.find(p => p.id === selectedPlanId)?.name.split(":")[0]}"
                  </div>
               </div>

               <div className="space-y-4 py-6 border-y border-zinc-800/50">
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span>{Math.floor(duration / 60)}m {(duration % 60).toString().padStart(2, '0')}s Duration</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span>AI Vision & Audio Analysis</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Play className="w-4 h-4" />
                    </div>
                    <span>Real-time Form Feedback</span>
                  </div>
               </div>

               <button
                onClick={handleStart}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                <Play className="w-5 h-5 fill-black" />
                Start Session
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-zinc-600 leading-relaxed max-w-sm mx-auto">
                Make sure your camera is positioned to see your full body and your microphone is enabled.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}