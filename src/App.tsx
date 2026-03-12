/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Concierge } from './components/Concierge';
import { Training } from './components/Training';
import { Analysis } from './components/Analysis';
import { AppScreen, TrainingConfig, DEFAULT_CONFIG, SessionStats } from './components/store';
import { Activity, LogOut } from 'lucide-react';

export default function App() {
  const { user, isLoading, login, logout } = useAuth();
  const [screen, setScreen] = useState<AppScreen>("concierge");
  const [config, setConfig] = useState<TrainingConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<SessionStats | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tighter uppercase">
            Cornerman <span className="text-emerald-500">AI</span>
          </h1>
          <p className="text-zinc-400 mb-8 font-mono text-sm uppercase tracking-wider">
            Your personal boxing coach. Train harder, smarter, and faster with real-time AI feedback.
          </p>
          <button
            onClick={login}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 relative">
      
      {/* User Status / Logout - Floating Top Right */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-full border border-zinc-800">
          <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" />
          <span className="text-xs font-mono uppercase text-zinc-400 hidden sm:inline">{user.name}</span>
          <button 
            onClick={logout}
            className="p-1 hover:text-emerald-500 transition-colors text-zinc-500"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {screen === "concierge" && (
        <Concierge 
          onStartRound={(cfg) => {
            if (cfg) setConfig(cfg);
            setScreen("training");
          }} 
        />
      )}

      {screen === "training" && (
        <Training 
          config={config} 
          onFinish={(s) => {
             setStats(s);
             setScreen("analysis");
          }} 
        />
      )}

      {screen === "analysis" && stats && (
        <Analysis 
          config={config} 
          stats={stats}
          onRestart={() => setScreen("concierge")} 
        />
      )}

    </div>
  );
}
