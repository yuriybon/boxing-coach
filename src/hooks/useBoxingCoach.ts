import { useState, useRef, useCallback, useEffect } from 'react';
import { floatTo16BitPCM, base64ToArrayBuffer, arrayBufferToBase64 } from '../lib/audioUtils';

export function useBoxingCoach() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mode, setMode] = useState<'concierge' | 'coach' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const nextPlayTimeRef = useRef(0);

  const connect = async (videoElement: HTMLVideoElement) => {
    setIsConnecting(true);
    setError(null);
    videoRef.current = videoElement;

    try {
      // 1. Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser or connection does not support camera/microphone access. Ensure you are using HTTPS or localhost.");
      }

      // 2. Get media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        }
      });
      mediaStreamRef.current = stream;
      videoElement.srcObject = stream;
      await videoElement.play();

      // 3. Setup Audio Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("Web Audio API is not supported in this browser.");
      }
      
      // On iOS, AudioContext must be resumed within a user gesture
      const audioContext = new AudioContextClass({ sampleRate: 16000 });
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Unlock audio on iOS by playing a short silent buffer
      const silentBuffer = audioContext.createBuffer(1, 1, 22050);
      const silentSource = audioContext.createBufferSource();
      silentSource.buffer = silentBuffer;
      silentSource.connect(audioContext.destination);
      silentSource.start(0);
      
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(512, 1, 1);
      processorRef.current = processor;

      // 3. Connect to our Backend via WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/coach`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setMode('concierge');

        // Start sending audio
        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = floatTo16BitPCM(inputData);
          const base64Data = arrayBufferToBase64(pcm16);
          
          ws.send(JSON.stringify({
            type: 'realtime_input',
            media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          }));
        };
        source.connect(processor);
        processor.connect(audioContextRef.current!.destination);

        // Start sending video frames
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
        const ctx = canvasRef.current.getContext('2d');

        frameIntervalRef.current = window.setInterval(() => {
          if (ws.readyState !== WebSocket.OPEN) return;
          if (videoRef.current && ctx && canvasRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, 640, 480);
            const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
            
            ws.send(JSON.stringify({
              type: 'realtime_input',
              media: { data: base64Image, mimeType: 'image/jpeg' }
            }));
          }
        }, 1000); // 1 frame per second
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        
        // Handle mode change
        if (msg.type === 'mode_change') {
          setMode(msg.mode);
        }

        // Handle audio output
        if (msg.type === 'audio') {
          const pcmBuffer = base64ToArrayBuffer(msg.data);
          const int16Array = new Int16Array(pcmBuffer);
          const float32Array = new Float32Array(int16Array.length);
          for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
          }
          await playAudio(float32Array);
        }
        
        // Handle interruption
        if (msg.type === 'interrupted') {
          nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
        }

        // Handle errors
        if (msg.type === 'error') {
          setError(msg.message);
          disconnect();
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection error");
        disconnect();
      };

      ws.onclose = () => {
        disconnect();
      };

    } catch (err: any) {
      console.error("Connection failed:", err);
      setError(err.message || "Failed to connect to camera/microphone");
      setIsConnecting(false);
      disconnect();
    }
  };

  const playAudio = async (audioData: Float32Array) => {
    if (!audioContextRef.current) return;
    
    // Ensure context is running (iOS Safari requirement)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
    audioBuffer.getChannelData(0).set(audioData);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);

    const currentTime = audioContextRef.current.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
      nextPlayTimeRef.current = currentTime;
    }

    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;
  };

  const startTraining = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_training' }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setMode(null);
    nextPlayTimeRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    mode,
    error,
    connect,
    disconnect,
    startTraining,
  };
}
