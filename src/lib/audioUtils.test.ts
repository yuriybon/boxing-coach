// src/lib/audioUtils.test.ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import {
  floatTo16BitPCM,
  base64ToArrayBuffer,
  arrayBufferToBase64,
  initializeAudio,
  resetAudio
} from './audioUtils'

describe('Audio Utils - WebAssembly Implementation', () => {
  
  // Initialize WASM before running tests
  beforeAll(async () => {
    await initializeAudio()
  })

  // Reset between tests for isolation
  afterEach(() => {
    // Keep WASM loaded for other tests
  })

  // ============ Float to 16-bit PCM Tests ============
  describe('floatTo16BitPCM', () => {
    
    it('should convert float32 to int16 PCM and return ArrayBuffer', () => {
      const input = new Float32Array([0.0, 0.5, -0.5, 1.0, -1.0])
      const result = floatTo16BitPCM(input)
      
      expect(result).toBeInstanceOf(ArrayBuffer)
      expect(result.byteLength).toBe(input.length * 2) // 2 bytes per int16
    })

    it('should have correct byte length', () => {
      const input = new Float32Array([0.0, 0.5, -0.5])
      const result = floatTo16BitPCM(input)
      
      // 3 samples × 2 bytes per int16 = 6 bytes
      expect(result.byteLength).toBe(6)
    })

    it('should clamp values to [-1, 1] range', () => {
      const input = new Float32Array([2.0, -2.0, 0.5])
      const result = floatTo16BitPCM(input)
      const view = new Int16Array(result)
      
      // 1.0 should map to 0x7fff (32767)
      // -1.0 should map to -0x8000 (-32768)
      expect(view[0]).toBe(32767) // clamped from 2.0
      expect(view[1]).toBe(-32768) // clamped from -2.0
      expect(view[2]).toBeGreaterThan(0) // 0.5 should be positive
    })

    it('should handle zero values', () => {
      const input = new Float32Array([0.0, 0.0, 0.0])
      const result = floatTo16BitPCM(input)
      const view = new Int16Array(result)
      
      expect(view[0]).toBe(0)
      expect(view[1]).toBe(0)
      expect(view[2]).toBe(0)
    })

    it('should preserve data for multiple calls', () => {
      const input = new Float32Array([0.3, -0.7, 0.5])
      const result1 = floatTo16BitPCM(input)
      const result2 = floatTo16BitPCM(input)
      
      const view1 = new Int16Array(result1)
      const view2 = new Int16Array(result2)
      
      expect(view1[0]).toBe(view2[0])
      expect(view1[1]).toBe(view2[1])
      expect(view1[2]).toBe(view2[2])
    })

    it('should handle large buffers', () => {
      const largeBuffer = new Float32Array(100000)
      largeBuffer.fill(0.5)
      
      const result = floatTo16BitPCM(largeBuffer)
      
      expect(result.byteLength).toBe(200000)
      const view = new Int16Array(result)
      expect(view.length).toBe(100000)
    })
  })

  // ============ Base64 Decode Tests ============
  describe('base64ToArrayBuffer', () => {
    
    it('should decode valid base64 string to ArrayBuffer', () => {
      const encoded = 'SGVsbG8gV29ybGQ=' // "Hello World"
      const result = base64ToArrayBuffer(encoded)
      
      expect(result).toBeInstanceOf(ArrayBuffer)
      expect(result.byteLength).toBeGreaterThan(0)
    })

    it('should decode to correct text', () => {
      const encoded = 'SGVsbG8gV29ybGQ=' // "Hello World"
      const result = base64ToArrayBuffer(encoded)
      const text = new TextDecoder().decode(new Uint8Array(result))
      
      expect(text).toBe('Hello World')
    })

    it('should handle base64 with padding', () => {
      const testCases = [
        { encoded: 'QQ==', expected: 'A' },
        { encoded: 'QUI=', expected: 'AB' },
        { encoded: 'QUJD', expected: 'ABC' }
      ]
      
      for (const { encoded, expected } of testCases) {
        const result = base64ToArrayBuffer(encoded)
        const text = new TextDecoder().decode(new Uint8Array(result))
        expect(text).toBe(expected)
      }
    })

    it('should handle empty base64 string', () => {
      const result = base64ToArrayBuffer('')
      expect(result.byteLength).toBe(0)
    })

    it('should decode special characters', () => {
      const encoded = 'VGhpcyBpcyBhIHRlc3Qh' // "This is a test!"
      const result = base64ToArrayBuffer(encoded)
      const text = new TextDecoder().decode(new Uint8Array(result))
      
      expect(text).toBe('This is a test!')
    })
  })

  // ============ Base64 Encode Tests ============
  describe('arrayBufferToBase64', () => {
    
    it('should encode ArrayBuffer to base64 string', () => {
      const text = 'Hello World'
      const buffer = new TextEncoder().encode(text).buffer
      const result = arrayBufferToBase64(buffer)
      
      expect(typeof result).toBe('string')
      expect(result).toBe('SGVsbG8gV29ybGQ=')
    })

    it('should handle empty buffer', () => {
      const buffer = new ArrayBuffer(0)
      const result = arrayBufferToBase64(buffer)
      
      expect(result).toBe('')
    })

    it('should encode single bytes correctly', () => {
      const testCases = [
        { byte: 0, expected: 'AA==' },
        { byte: 65, expected: 'QQ==' },  // 'A'
        { byte: 255, expected: '/w==' }
      ]
      
      for (const { byte, expected } of testCases) {
        const buffer = new Uint8Array([byte]).buffer
        const result = arrayBufferToBase64(buffer)
        expect(result).toBe(expected)
      }
    })

    it('should encode binary data', () => {
      const binary = new Uint8Array([72, 101, 108, 108, 111]).buffer
      const result = arrayBufferToBase64(binary)
      
      expect(result).toBe('SGVsbG8=')
    })
  })

  // ============ Roundtrip Tests ============
  describe('Base64 Roundtrip (Encode <-> Decode)', () => {
    
    it('should roundtrip text data', () => {
      const original = 'Hello, WebAssembly!'
      const buffer = new TextEncoder().encode(original).buffer
      const encoded = arrayBufferToBase64(buffer)
      const decoded = base64ToArrayBuffer(encoded)
      const result = new TextDecoder().decode(new Uint8Array(decoded))
      
      expect(result).toBe(original)
    })

    it('should roundtrip binary data', () => {
      const original = new Uint8Array(256)
      for (let i = 0; i < 256; i++) {
        original[i] = i
      }
      
      const encoded = arrayBufferToBase64(original.buffer)
      const decoded = base64ToArrayBuffer(encoded)
      const result = new Uint8Array(decoded)
      
      expect(Array.from(result)).toEqual(Array.from(original))
    })

    it('should handle large data roundtrip', () => {
      const original = new Uint8Array(10000)
      for (let i = 0; i < original.length; i++) {
        original[i] = Math.floor(Math.random() * 256)
      }
      
      const encoded = arrayBufferToBase64(original.buffer)
      const decoded = base64ToArrayBuffer(encoded)
      const result = new Uint8Array(decoded)
      
      expect(result.length).toBe(original.length)
      expect(Array.from(result)).toEqual(Array.from(original))
    })
  })

  // ============ Integration Tests ============
  describe('Integration - Audio Processing Pipeline', () => {
    
    it('should convert and encode audio', () => {
      const audioBuffer = new Float32Array([0.1, 0.2, -0.3, 0.5])
      
      // Convert to PCM
      const pcmBuffer = floatTo16BitPCM(audioBuffer)
      expect(pcmBuffer.byteLength).toBe(audioBuffer.length * 2)
      
      // Encode to base64
      const encoded = arrayBufferToBase64(pcmBuffer)
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should complete full audio pipeline', () => {
      const audioBuffer = new Float32Array([0.5, -0.5, 0.25, -0.75])
      
      // Step 1: Convert to PCM
      const pcmBuffer = floatTo16BitPCM(audioBuffer)
      
      // Step 2: Encode to base64
      const encoded = arrayBufferToBase64(pcmBuffer)
      
      // Step 3: Decode back
      const decoded = base64ToArrayBuffer(encoded)
      
      // Step 4: Verify
      expect(decoded.byteLength).toBe(pcmBuffer.byteLength)
      const originalView = new Int16Array(pcmBuffer)
      const decodedView = new Int16Array(decoded)
      
      for (let i = 0; i < originalView.length; i++) {
        expect(decodedView[i]).toBe(originalView[i])
      }
    })
  })

  // ============ Error Handling ============
  describe('Error Handling', () => {
    
    it('should throw if WASM not initialized', () => {
      resetAudio()
      const input = new Float32Array([0.5])
      
      expect(() => floatTo16BitPCM(input)).toThrow('Audio module not initialized')
    })

    it('should recover after re-initialization', async () => {
      resetAudio()
      await initializeAudio()
      
      const input = new Float32Array([0.5])
      const result = floatTo16BitPCM(input)
      
      expect(result).toBeInstanceOf(ArrayBuffer)
    })
  })
})