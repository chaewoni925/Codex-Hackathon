import type { Change, InspectResult, NoticeResult, RouteResult, SpaceType, RouteStep } from './types'
export async function getRoute(spaceType: SpaceType, zones: { id: string; name: string; baselinePhoto: string }[]): Promise<RouteResult> {
  const result = await request<RouteResult>('/api/route', { spaceType, zones })
  if (result.fallback) throw new Error('기준 사진에서 점검 동선을 만들지 못했어요. 같은 사진으로 다시 시도해주세요.')
  return result
}
export async function inspectZone(input: { zoneId: string; baseline: string; today: string; spots: RouteStep[]; mockPerson?: boolean }): Promise<InspectResult> {
  const result = await request<InspectResult>('/api/inspect', input)
  if (result.fallback && !input.mockPerson) throw new Error('AI가 두 사진의 비교 결과를 반환하지 못했어요. 다시 분석해주세요.')
  return result
}
export async function inspectPhoto(input: { zoneId: string; baseline: string; today: string; spots: RouteStep[] }): Promise<InspectResult> {
  return request('/api/inspect', input)
}
export async function getNotice(summary: string): Promise<NoticeResult> {
  return request('/api/notice', { summary })
}
async function request<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 60000)
  try {
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal })
    if (!response.ok) throw new Error()
    return sanitize(await response.json()) as T
  } catch {
    throw new Error('요청을 처리하지 못했어요. 연결을 확인한 뒤 다시 시도해주세요.')
  } finally { clearTimeout(timeout) }
}
function sanitize<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/안전합니다|안전해요|안전해|문제\s*없음|문제없|카메라\s*없음|이상\s*없음/g, '확인 필요') as T
  if (Array.isArray(value)) return value.map(sanitize) as T
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitize(item)])) as T
  return value
}
export type { Change }
