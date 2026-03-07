/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { useBoxingCoach } from './hooks/useBoxingCoach';
import { useAuth } from './hooks/useAuth';
import { Mic, MicOff, Video, Activity, AlertCircle, LogOut, User as UserIcon } from 'lucide-react';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user, isLoading, login, logout } = useAuth();
  const { isConnected, isConnecting, error, connect, disconnect } = useBoxingCoach();

  const handleToggleConnect = () => {
    if (isConnected || isConnecting) {
      disconnect();
    } else {
      if (videoRef.current) {
        connect(videoRef.current);
      }
    }
  };

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto p-6 md:p-12 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-white">
                Cornerman <span className="text-emerald-500">AI</span>
              </h1>
              <p className="text-zinc-400 mt-2 font-mono text-sm uppercase tracking-widest">
                Live Multimodal Boxing Coach
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
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
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-xs uppercase tracking-wider ${
              isConnected 
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                : isConnecting
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-zinc-800 bg-zinc-900 text-zinc-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : isConnecting ? 'bg-amber-500 animate-pulse' : 'bg-zinc-600'
              }`} />
              {isConnected ? 'Live' : isConnecting ? 'Connecting...' : 'Standby'}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Video Feed */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 aspect-video flex items-center justify-center">
            <video 
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isConnected ? 'opacity-100' : 'opacity-0'
              }`}
              playsInline
              muted
            />
            
            {!isConnected && (
              <div className="text-center p-8">
                <Video className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">Camera Feed Offline</p>
              </div>
            )}

            {/* Overlay UI */}
            {isConnected && (
              <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 font-mono text-xs text-emerald-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Analyzing Form
                  </div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 font-mono text-xs text-zinc-300 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    Listening for impact
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls & Status */}
          <div className="flex flex-col gap-6">
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wide mb-2">Training Session</h2>
                <p className="text-zinc-400 text-sm">
                  Position your camera to see your full body and the punch bag. Ensure your microphone can hear your breathing and punches.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handleToggleConnect}
                disabled={isConnecting}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-3 ${
                  isConnected
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isConnected ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    End Session
                  </>
                ) : isConnecting ? (
                  'Connecting...'
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Start Training
                  </>
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-4">How it works</h3>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">01</span>
                  <span>Cornerman watches your form via camera.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">02</span>
                  <span>It listens to your effort and punches via mic.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">03</span>
                  <span>It calls out combos and feedback in real-time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">04</span>
                  <span>Speak to it to ask for specific drills or breaks.</span>
                </li>
              </ul>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
