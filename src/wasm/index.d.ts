/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * src/assembly/audio/floatTo16BitPCM
 * @param input `~lib/typedarray/Float32Array`
 * @returns `~lib/typedarray/Int16Array`
 */
export declare function floatTo16BitPCM(input: Float32Array): Int16Array;
/**
 * src/assembly/audio/base64Decode
 * @param input `~lib/string/String`
 * @returns `~lib/typedarray/Uint8Array`
 */
export declare function base64Decode(input: string): Uint8Array;
/**
 * src/assembly/audio/base64Encode
 * @param input `~lib/typedarray/Uint8Array`
 * @returns `~lib/string/String`
 */
export declare function base64Encode(input: Uint8Array): string;
