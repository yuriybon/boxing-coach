import { describe, it, expect } from 'vitest';
import { floatTo16BitPCM, base64ToArrayBuffer, arrayBufferToBase64 } from './audioUtils';

describe('audioUtils', () => {
  it('should convert Float32Array to 16-bit PCM ArrayBuffer', () => {
    const input = new Float32Array([1.0, -1.0, 0.5, -0.5, 0]);
    const buffer = floatTo16BitPCM(input);
    const output = new Int16Array(buffer);
    
    expect(output.length).toBe(5);
    // 1.0 -> 32767 (0x7fff)
    expect(output[0]).toBe(0x7fff);
    // -1.0 -> -32768 (-0x8000)
    expect(output[1]).toBe(-0x8000);
    // 0.5 -> 16383 (approx 0x3fff)
    expect(output[2]).toBeCloseTo(0x3fff, -1);
    // -0.5 -> -16384 (approx -0x4000)
    expect(output[3]).toBeCloseTo(-0x4000, -1);
    // 0 -> 0
    expect(output[4]).toBe(0);
  });

  it('should convert ArrayBuffer to Base64 and back', () => {
    const originalString = "Hello World";
    // Convert string to ArrayBuffer
    const buffer = new Uint8Array(originalString.split('').map(c => c.charCodeAt(0))).buffer;
    
    // Test ArrayBuffer -> Base64
    const base64 = arrayBufferToBase64(buffer);
    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(0);
    
    // Test Base64 -> ArrayBuffer
    const decodedBuffer = base64ToArrayBuffer(base64);
    const decodedString = String.fromCharCode(...new Uint8Array(decodedBuffer));
    
    expect(decodedString).toBe(originalString);
  });
});
