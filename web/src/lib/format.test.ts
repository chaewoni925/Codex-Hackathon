import { describe, expect, it } from 'vitest'
import { formatDateTime } from './format'

describe('formatDateTime', () => {
  it('한국 시간대로 읽을 수 있는 입력을 한글 날짜로 표시한다', () => {
    expect(formatDateTime('2026-11-27T14:10:00+09:00')).toBe('11월 27일 (금) 오후 2:10')
  })
  it('잘못된 날짜는 명시적으로 거부한다', () => {
    expect(() => formatDateTime('invalid')).toThrow(RangeError)
  })
})
