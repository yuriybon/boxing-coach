// src/lib/wasm-loader.ts - финальная версия
let cachedWasm: any = null

export async function initWasm() {
  if (cachedWasm) return cachedWasm

  try {
    let buffer: ArrayBuffer

    // Browser
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      const wasmUrl = new URL('../wasm/index.wasm', import.meta.url).href
      const response = await fetch(wasmUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch WASM: ${response.statusText}`)
      }
      buffer = await response.arrayBuffer()
    } 
    // Node.js
    else {
      const fs = await import('fs')
      const path = await import('path')
      const { fileURLToPath } = await import('url')

      const __filename = fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)
      const wasmPath = path.join(__dirname, '../wasm/index.wasm')
      
      if (!fs.existsSync(wasmPath)) {
        throw new Error(`WASM file not found at ${wasmPath}`)
      }
      
      const wasmData = fs.readFileSync(wasmPath)
      buffer = wasmData.buffer.slice(
        wasmData.byteOffset,
        wasmData.byteOffset + wasmData.byteLength
      )
    }

    const { instance } = await WebAssembly.instantiate(buffer)
    cachedWasm = instance.exports
    return cachedWasm
  } catch (error) {
    console.error('Failed to load WASM:', error)
    throw error
  }
}

export function resetWasm() {
  cachedWasm = null
}