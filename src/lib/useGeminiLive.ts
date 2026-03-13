import { useState, useRef, useCallback, useEffect } from 'react';
import { floatTo16BitPCM, base64ToArrayBuffer, arrayBufferToBase64 } from './audioUtils';

export interface UseGeminiLiveOptions {
  systemInstruction: string;
  voiceName?: string;
  tools?: any[];
  onMessage?: (message: any) => void;
  audioSettings?: {
    noiseSuppression: boolean;
    echoCancellation: boolean;
  };
}

export interface UseGeminiLiveReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendVideoFrame: (base64Data: string) => void;
  sendToolResponse: (toolResponses: any[]) => void;
}

export function useGeminiLive(options: UseGeminiLiveOptions): UseGeminiLiveReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef(0);

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);

    try {
      // 1. Get Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: options.audioSettings?.echoCancellation ?? true,
          noiseSuppression: options.audioSettings?.noiseSuppression ?? true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Setup Audio Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: 16000 });
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;

      // Unlock audio on iOS
      const silentBuffer = audioContext.createBuffer(1, 1, 22050);
      const silentSource = audioContext.createBufferSource();
      silentSource.buffer = silentBuffer;
      silentSource.connect(audioContext.destination);
      silentSource.start(0);

      // 3. Audio Processing
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(512, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContext.destination); // Required for script processor to run, even if we don't output audio here

      // 4. WebSocket Connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/coach`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);

        // Send initialization config
        ws.send(JSON.stringify({
          type: 'start_session',
          config: {
            systemInstruction: options.systemInstruction,
            voiceName: options.voiceName || "Zephyr",
            tools: options.tools,
          }
        }));

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
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        
        if (options.onMessage) {
          options.onMessage(msg);
        }

        // Handle Audio
        if (msg.type === 'audio') {
          const pcmBuffer = base64ToArrayBuffer(msg.data);
          const int16Array = new Int16Array(pcmBuffer);
          const float32Array = new Float32Array(int16Array.length);
          for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
          }
          await playAudio(float32Array);
        }

        // Handle Interruption
        if (msg.type === 'interrupted') {
          if (audioContextRef.current) {
             nextPlayTimeRef.current = audioContextRef.current.currentTime;
          }
        }
      };

      ws.onclose = () => {
        disconnect();
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        disconnect();
      };

    } catch (err) {
      console.error("Connection failed:", err);
      disconnect();
    }
  }, [isConnected, isConnecting, options]);

  const playAudio = async (audioData: Float32Array) => {
    if (!audioContextRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 24000); // Gemini output is 24kHz
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
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    nextPlayTimeRef.current = 0;
  }, []);

  const sendVideoFrame = useCallback((base64Data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'realtime_input',
        media: { data: base64Data, mimeType: 'image/jpeg' }
      }));
    }
  }, []);

  const sendToolResponse = useCallback((toolResponses: any[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'tool_response',
        toolResponses
      }));
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendVideoFrame,
    sendToolResponse
  };
}
