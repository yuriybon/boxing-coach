import { describe, it, expect, bench } from 'vitest';
import { floatTo16BitPCM, base64ToArrayBuffer, arrayBufferToBase64 } from './audioUtils';

describe('audioUtils Logic & Correctness', () => {
  it('should convert Float32Array to 16-bit PCM ArrayBuffer correctly', () => {
    const input = new Float32Array([1.0, -1.0, 0.5, -0.5, 0]);
    const buffer = floatTo16BitPCM(input);
    const output = new Int16Array(buffer);
    
    expect(output.length).toBe(5);
    expect(output[0]).toBe(0x7fff);       //  32767
    expect(output[1]).toBe(-0x8000);      // -32768
    // 0.5 * 0x7fff = 16383.5 -> floor/round depends on impl, usually floor in bitwise but here it's mult
    // implementation: s < 0 ? s * 0x8000 : s * 0x7fff
    // 0.5 * 32767 = 16383.5. Int16Array will truncate or round? 
    // JS numbers are doubles. storing to Int16Array will truncate.
    // Let's verify exact behavior in test.
    // 16383.5 -> 16383
    expect(output[2]).toBe(16383); 
    
    // -0.5 * 32768 = -16384
    expect(output[3]).toBe(-16384);
    
    expect(output[4]).toBe(0);
  });

  it('should handle clipping in floatTo16BitPCM', () => {
    const input = new Float32Array([1.5, -1.5]);
    const buffer = floatTo16BitPCM(input);
    const output = new Int16Array(buffer);
    expect(output[0]).toBe(0x7fff);
    expect(output[1]).toBe(-0x8000);
  });

  it('should convert ArrayBuffer to Base64 and back losslessly', () => {
    // Create a buffer with all possible byte values
    const originalBytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      originalBytes[i] = i;
    }
    
    // ArrayBuffer -> Base64
    const base64 = arrayBufferToBase64(originalBytes.buffer);
    expect(typeof base64).toBe('string');
    
    // Base64 -> ArrayBuffer
    const decodedBuffer = base64ToArrayBuffer(base64);
    const decodedBytes = new Uint8Array(decodedBuffer);
    
    expect(decodedBytes).toEqual(originalBytes);
  });
  
  it('should handle large buffers correctly (correctness check)', () => {
     // 1MB buffer
     const size = 1024 * 1024;
     const originalBytes = new Uint8Array(size);
     for(let i=0; i<size; i++) originalBytes[i] = i % 256;
     
     const base64 = arrayBufferToBase64(originalBytes.buffer);
     const decoded = base64ToArrayBuffer(base64);
     const decodedBytes = new Uint8Array(decoded);
     
     expect(decodedBytes.length).toBe(size);
     
     // Manual check is faster than .toEqual for large arrays in test runners
     let mismatch = -1;
     for(let i=0; i<size; i++) {
       if (decodedBytes[i] !== originalBytes[i]) {
         mismatch = i;
         break;
       }
     }
     expect(mismatch).toBe(-1);
  });
});

// Performance tests using simple timing, as 'bench' might be experimental or require specific config
describe('audioUtils Performance (High Load)', () => {
  // Generate 10 seconds of audio at 48kHz stereo (approx) -> 48000 * 2 * 10 = 960,000 samples
  const SAMPLE_RATE = 48000;
  const DURATION_SEC = 10;
  const NUM_SAMPLES = SAMPLE_RATE * DURATION_SEC;
  
  const largeFloatArray = new Float32Array(NUM_SAMPLES);
  for (let i = 0; i < NUM_SAMPLES; i++) {
    largeFloatArray[i] = Math.sin(i / 100); // Dummy audio data
  }

  it(`perf: floatTo16BitPCM with ${NUM_SAMPLES} samples`, () => {
    const start = performance.now();
    const result = floatTo16BitPCM(largeFloatArray);
    const end = performance.now();
    
    const duration = end - start;
    console.log(`floatTo16BitPCM (${NUM_SAMPLES} samples): ${duration.toFixed(2)}ms`);
    
    // Basic assertion to ensure it's fast enough (e.g., < 100ms for 10s audio is plenty fast for realtime)
    // Realtime constraint: 10s audio processed in < 10s. 
    // Actually we want it much faster. 10s audio in < 50ms is good target.
    expect(duration).toBeLessThan(200); 
    expect(result.byteLength).toBe(NUM_SAMPLES * 2);
  });

  it('perf: arrayBufferToBase64 (large buffer)', () => {
    // Create a large PCM buffer (simulating the output of the previous step)
    const pcmBuffer = new Int16Array(NUM_SAMPLES).buffer;
    
    const start = performance.now();
    const base64 = arrayBufferToBase64(pcmBuffer);
    const end = performance.now();
    
    const duration = end - start;
    console.log(`arrayBufferToBase64 (${pcmBuffer.byteLength} bytes): ${duration.toFixed(2)}ms`);
    
    // The optimized chunked approach should be significantly faster than the loop
    expect(duration).toBeLessThan(300); 
    expect(typeof base64).toBe('string');
  });
  
  it('perf: base64ToArrayBuffer (large string)', () => {
    // Setup: create the base64 string first
    const pcmBuffer = new Int16Array(NUM_SAMPLES).buffer;
    const base64 = arrayBufferToBase64(pcmBuffer);
    
    const start = performance.now();
    const result = base64ToArrayBuffer(base64);
    const end = performance.now();

    const duration = end - start;
    console.log(`base64ToArrayBuffer (${base64.length} chars): ${duration.toFixed(2)}ms`);
    
    expect(duration).toBeLessThan(300);
    expect(result.byteLength).toBe(pcmBuffer.byteLength);
  });
});