const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function toBase64(bytes: Uint8Array): string {
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index] ?? 0;
    const byte2 = bytes[index + 1] ?? 0;
    const byte3 = bytes[index + 2] ?? 0;

    const combined = (byte1 << 16) | (byte2 << 8) | byte3;

    output += BASE64_ALPHABET[(combined >> 18) & 0x3f];
    output += BASE64_ALPHABET[(combined >> 12) & 0x3f];
    output += index + 1 < bytes.length ? BASE64_ALPHABET[(combined >> 6) & 0x3f] : "=";
    output += index + 2 < bytes.length ? BASE64_ALPHABET[combined & 0x3f] : "=";
  }

  return output;
}

export function encodeBase64Utf8(value: string): string {
  if (typeof TextEncoder === "undefined") {
    throw new Error("TextEncoder is required for base64 encoding");
  }

  return toBase64(new TextEncoder().encode(value));
}
