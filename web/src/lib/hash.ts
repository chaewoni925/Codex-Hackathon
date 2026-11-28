/** SHA-256 digest를 소문자 16진수 문자열로 반환합니다. */
export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** 해시의 앞 4자리와 뒤 4자리를 줄임표로 연결합니다. */
export function shortHash(hash: string): string {
  return `${hash.slice(0, 4)}…${hash.slice(-4)}`
}
