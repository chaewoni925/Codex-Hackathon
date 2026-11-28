import type { GuestSummary } from '../types'
export type { GuestSummary } from '../types'

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

export function encodeSummary(summary: GuestSummary): string {
  const json = JSON.stringify(summary)
  if (typeof json !== 'string') throw new TypeError('요약을 JSON으로 변환할 수 없습니다')
  if (json.includes('data:image')) throw new Error('사진은 공유 요약에 포함할 수 없습니다')
  return toBase64Url(json)
}

export function decodeSummary(value: string): GuestSummary | null {
  try {
    const decoded: unknown = JSON.parse(fromBase64Url(value))
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return null
    const json = JSON.stringify(decoded)
    if (!json || json.includes('data:image')) return null
    return decoded as GuestSummary
  } catch {
    return null
  }
}

export function guestUrl(data: string): string {
  const base = import.meta.env.VITE_PUBLIC_URL || location.origin
  return `${base.replace(/\/$/, '')}/#/g/${data}`
}
