// src/lib/audioUtils.ts
import { initWasm } from './wasm-loader'

let wasmModule: any = null
let wasmInitialized = false

/**
 * Initialize WASM module once at startup
 * Call this before using audio functions
 */
export async function initializeAudio(): Promise<void> {
  if (wasmInitialized) return
  wasmModule = await initWasm()
  wasmInitialized = true
}

/**
 * Convert Float32 audio samples to 16-bit PCM
 * @param input - Float32Array with values between -1.0 and 1.0
 * @returns ArrayBuffer containing 16-bit PCM samples
 */
export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  if (!wasmInitialized || !wasmModule) {
    throw new Error('Audio module not initialized. Call initializeAudio() first.')
  }
  
  const output = wasmModule.floatTo16BitPCM(input)
  return output.buffer
}

/**
 * Decode Base64 string to ArrayBuffer
 * @param base64 - Base64 encoded string
 * @returns ArrayBuffer containing decoded bytes
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (!wasmInitialized || !wasmModule) {
    throw new Error('Audio module not initialized. Call initializeAudio() first.')
  }
  
  const bytes = wasmModule.base64Decode(base64)
  return bytes.buffer
}

/**
 * Encode ArrayBuffer to Base64 string
 * @param buffer - ArrayBuffer to encode
 * @returns Base64 encoded string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (!wasmInitialized || !wasmModule) {
    throw new Error('Audio module not initialized. Call initializeAudio() first.')
  }
  
  const bytes = new Uint8Array(buffer)
  return wasmModule.base64Encode(bytes)
}

/**
 * Reset audio module (useful for testing)
 */
export function resetAudio(): void {
  wasmModule = null
  wasmInitialized = false
}