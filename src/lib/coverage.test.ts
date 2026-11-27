import { describe, expect, it } from 'vitest'
import { calcCoverage } from './coverage'
import type { Change, RouteStep } from '../types'

describe('calcCoverage', () => {
  it('선택한 지점을 세고 미선택 또는 미포함 지점을 반환한다', () => {
    expect(calcCoverage(
      [
        { order: 1, zoneId: 'z1', spotId: 'a', object: '선반', where: '왼쪽', reason: '', check: '', priority: '보통' },
        { order: 2, zoneId: 'z1', spotId: 'b', object: '문', where: '입구', reason: '', check: '', priority: '높음' },
      ] satisfies RouteStep[],
      [{ spotId: 'a', covered: true, status: '확인함' }, { spotId: 'b', covered: false, status: '미확인' }],
      [{ zoneId: 'z1', object: '새 물건', change: '새로 생김', where: '창가', check: '', priority: '보통' }] satisfies Change[],
    )).toEqual({ checked: 1, total: 3, missing: ['b', 'change:z1:새 물건'] })
  })
})
