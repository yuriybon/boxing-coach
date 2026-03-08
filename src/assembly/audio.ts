// Конвертирует Float32Array в Int16Array (16-bit PCM)
export function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)
  
  for (let i = 0; i < input.length; i++) {
    let s = input[i]
    
    // Клипируем значения в диапазон [-1, 1]
    if (s > 1.0) s = 1.0
    if (s < -1.0) s = -1.0
    
    // Масштабируем до int16 диапазона
    if (s < 0.0) {
      output[i] = i16(s * 0x8000)
    } else {
      output[i] = i16(s * 0x7fff)
    }
  }
  
  return output
}

// Base64 декодирование
export function base64Decode(input: string): Uint8Array {
  const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  const decoded = new Uint8Array(1024) // Pre-allocate with reasonable size
  let decodedIdx = 0
  
  let i = 0
  while (i < input.length) {
    const c1 = base64Chars.indexOf(input.charAt(i++))
    const c2 = base64Chars.indexOf(input.charAt(i++))
    const c3 = base64Chars.indexOf(input.charAt(i++))
    const c4 = base64Chars.indexOf(input.charAt(i++))
    
    if (c1 >= 0 && c2 >= 0) {
      // Cast the result to u8 explicitly
      const byte1: u8 = u8((c1 << 2) | (c2 >> 4))
      decoded[decodedIdx++] = byte1
      
      if (c3 >= 0) {
        const byte2: u8 = u8((c2 << 4) | (c3 >> 2))
        decoded[decodedIdx++] = byte2
        
        if (c4 >= 0) {
          const byte3: u8 = u8((c3 << 6) | c4)
          decoded[decodedIdx++] = byte3
        }
      }
    }
  }
  
  // Return only the decoded portion
  return decoded.slice(0, decodedIdx)
}

// Base64 кодирование
export function base64Encode(input: Uint8Array): string {
  const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  let encoded = ""
  
  let i = 0
  while (i < input.length) {
    const b1 = input[i++]
    const b2 = i < input.length ? input[i++] : 0
    const b3 = i < input.length ? input[i++] : 0
    
    const c1 = (b1 >> 2) & 0x3F
    const c2 = ((b1 << 4) | (b2 >> 4)) & 0x3F
    const c3 = ((b2 << 2) | (b3 >> 6)) & 0x3F
    const c4 = b3 & 0x3F
    
    encoded += base64Chars.charAt(c1)
    encoded += base64Chars.charAt(c2)
    encoded += i - input.length < 2 ? base64Chars.charAt(c3) : '='
    encoded += i - input.length < 1 ? base64Chars.charAt(c4) : '='
  }
  
  return encoded
}