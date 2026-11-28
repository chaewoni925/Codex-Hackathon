import { describe, expect, it } from 'vitest'
import { decodeSummary, encodeSummary } from './share'

describe('share summary encoding', () => {
  it('UTF-8 내용을 base64url로 왕복한다', () => {
    const input = { spaceName: '점검 요약', at: '2026-11-27', coverage: { checked: 1, total: 1 }, spots: [{ order: 1, object: '문', where: '입구', check: '확인' }], changesCount: 0 }
    expect(decodeSummary(encodeSummary(input))).toEqual(input)
  })
  it('이미지 data URL이 포함되면 인코딩을 거부한다', () => {
    expect(() => encodeSummary({ spaceName: '공간', at: '', coverage: { checked: 0, total: 0 }, spots: [{ order: 1, object: '문', where: 'data:image/jpeg;base64,abc', check: '' }], changesCount: 0 })).toThrow()
  })
  it('잘못된 데이터는 null이다', () => {
    expect(decodeSummary('%%%')).toBeNull()
  })
})
