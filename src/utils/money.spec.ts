import { describe, expect, it } from 'vitest'
import { formatWon, formatWonKorean, monthlyRate, sumWon, won } from './money'

describe('won', () => {
  it('원 단위 정수로 확정한다', () => {
    expect(won(1234.4)).toBe(1234)
    expect(won(1234.5)).toBe(1235)
    expect(won(-1234.5)).toBe(-1234) // Math.round 규칙(양의 무한대 방향)
  })

  it('유한하지 않은 값은 0으로 처리한다', () => {
    expect(won(NaN)).toBe(0)
    expect(won(Infinity)).toBe(0)
  })
})

describe('sumWon', () => {
  it('부동소수 누적 오차 없이 합산한다', () => {
    // 0.1 * 3 !== 0.3 이지만, 원 단위로 확정한 뒤 더하므로 정확하다
    expect(sumWon([0.1, 0.2, 0.3])).toBe(0)
    expect(sumWon([1000.6, 2000.6])).toBe(3002)
    expect(sumWon([])).toBe(0)
  })
})

describe('formatWon', () => {
  it('천단위 구분자와 단위를 붙인다', () => {
    expect(formatWon(1234567)).toBe('1,234,567원')
    expect(formatWon(0)).toBe('0원')
  })

  it('유한하지 않은 값은 하이픈으로 표시한다', () => {
    expect(formatWon(NaN)).toBe('-')
  })
})

describe('formatWonKorean', () => {
  it('한국식 단위로 끊어 읽는다', () => {
    expect(formatWonKorean(123456789)).toBe('1억 2,345만 6,789')
    expect(formatWonKorean(500000000)).toBe('5억')
    expect(formatWonKorean(10000)).toBe('1만')
    expect(formatWonKorean(0)).toBe('0')
  })

  it('음수도 처리한다', () => {
    expect(formatWonKorean(-50000)).toBe('-5만')
  })
})

describe('monthlyRate', () => {
  it('연이율을 월이율 소수로 바꾼다', () => {
    expect(monthlyRate(4.5)).toBeCloseTo(0.00375, 10)
    expect(monthlyRate(0)).toBe(0)
  })
})
