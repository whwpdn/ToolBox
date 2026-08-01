import { describe, expect, it } from 'vitest'
import { calcVat } from './logic'

describe('calcVat · 공급가 기준', () => {
  it('공급가 10만원 → 부가세 1만원, 합계 11만원', () => {
    expect(calcVat(100_000, 'supply')).toEqual({ supply: 100_000, vat: 10_000, total: 110_000 })
  })

  it('공급가 1,234,567원', () => {
    const r = calcVat(1_234_567, 'supply')
    expect(r.supply).toBe(1_234_567)
    expect(r.vat).toBe(123_457) // 반올림
    expect(r.total).toBe(r.supply + r.vat)
  })
})

describe('calcVat · 합계 기준 (역산)', () => {
  it('합계 11만원 → 공급가 10만원, 부가세 1만원', () => {
    expect(calcVat(110_000, 'total')).toEqual({ supply: 100_000, vat: 10_000, total: 110_000 })
  })

  it('합계에 10%를 곱하는 흔한 실수를 하지 않는다', () => {
    // 11만원의 부가세는 1.1만원이 아니라 1만원
    expect(calcVat(110_000, 'total').vat).toBe(10_000)
    expect(calcVat(110_000, 'total').vat).not.toBe(11_000)
  })

  it('합계 10만원 → 공급가 90,909원, 부가세 9,091원', () => {
    const r = calcVat(100_000, 'total')
    expect(r.supply).toBe(90_909)
    expect(r.vat).toBe(9_091)
  })
})

describe('calcVat · 정합성', () => {
  it('공급가 + 부가세 = 합계 (항상)', () => {
    for (const amount of [1, 7, 999, 100_000, 1_234_567, 98_765_432]) {
      for (const base of ['supply', 'total'] as const) {
        const r = calcVat(amount, base)
        expect(r.supply + r.vat, `${amount}/${base}`).toBe(r.total)
      }
    }
  })

  it('공급가 기준 → 합계 기준 왕복이 보존된다', () => {
    const forward = calcVat(100_000, 'supply')
    const back = calcVat(forward.total, 'total')
    expect(back.supply).toBe(100_000)
    expect(back.vat).toBe(forward.vat)
  })

  it('모든 값이 원 단위 정수다', () => {
    const r = calcVat(333_333, 'total')
    expect(Number.isInteger(r.supply)).toBe(true)
    expect(Number.isInteger(r.vat)).toBe(true)
    expect(Number.isInteger(r.total)).toBe(true)
  })
})

describe('calcVat · 경계값', () => {
  it('0이나 음수는 모두 0', () => {
    expect(calcVat(0, 'supply')).toEqual({ supply: 0, vat: 0, total: 0 })
    expect(calcVat(-1000, 'total')).toEqual({ supply: 0, vat: 0, total: 0 })
  })

  it('유한하지 않은 값도 안전하다', () => {
    expect(calcVat(NaN, 'supply').total).toBe(0)
    expect(calcVat(Infinity, 'total').total).toBe(0)
  })

  it('세율을 바꿀 수 있다', () => {
    const r = calcVat(100_000, 'supply', 0.05)
    expect(r.vat).toBe(5_000)
    expect(r.total).toBe(105_000)
  })
})
