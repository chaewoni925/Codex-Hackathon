import type { Change, Inspection, RouteStep } from '../types'

export type CoverageSummary = { checked: number; total: number; missing: string[] }

export function calcCoverage(route: RouteStep[], results: Inspection['results'], changes: Change[]): CoverageSummary {
  const newChanges = changes.filter((change) => change.change === '새로 생김')
  const total = route.length + newChanges.length
  const resultBySpot = new Map(results.map((result) => [result.spotId, result]))
  let checked = 0
  const missing: string[] = []

  for (const step of route) {
    const result = resultBySpot.get(step.spotId)
    if (result?.status === '확인함' || result?.status === '이상해요') checked += 1
    if (!result || result.status === '미확인' || !result.covered) missing.push(step.spotId)
  }

  for (const change of newChanges) {
    const result = resultBySpot.get(`change:${change.zoneId}:${change.object}`)
    if (result?.status === '확인함' || result?.status === '이상해요') checked += 1
    if (!result || result.status === '미확인' || !result.covered) missing.push(`change:${change.zoneId}:${change.object}`)
  }

  return { checked, total, missing }
}
