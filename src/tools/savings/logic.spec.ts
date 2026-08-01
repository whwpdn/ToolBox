import { describe, expect, it } from 'vitest'
import {
  calcSavings,
  depositInterest,
  installmentCompoundInterest,
  installmentSimpleInterest,
  type SavingsInput,
} from './logic'

const base: SavingsInput = {
  kind: 'installment',
  amount: 500_000,
  annualRatePct: 4,
  months: 12,
  interest: 'simple',
  taxed: false,
}

describe('installmentSimpleInterest', () => {
  it('n(n+1)/2 공식과 일치한다 (은행 적금 표준)', () => {
    // 월 50만 × 월이율(4%/12) × (12×13/2 = 78) = 130,000
    expect(installmentSimpleInterest(500_000, 4, 12)).toBeCloseTo(130_000, 6)
  })

  it('1개월이면 1회분 이자만 붙는다', () => {
    // 50만 × 0.04/12 × 1 = 1,666.67
    expect(installmentSimpleInterest(500_000, 4, 1)).toBeCloseTo(500_000 * (0.04 / 12), 8)
  })

  it('금리 0이면 이자도 0', () => {
    expect(installmentSimpleInterest(500_000, 0, 12)).toBe(0)
  })

  it('납입액이나 기간이 0이면 0', () => {
    expect(installmentSimpleInterest(0, 4, 12)).toBe(0)
    expect(installmentSimpleInterest(500_000, 4, 0)).toBe(0)
  })

  it('같은 총액을 예금으로 넣는 것보다 이자가 적다', () => {
    // 적금 월 50만 12개월(총 600만) vs 예금 600만 1년
    const inst = installmentSimpleInterest(500_000, 4, 12)
    const dep = depositInterest(6_000_000, 4, 12, 'simple')
    expect(inst).toBeLessThan(dep)
    // 평균 예치기간이 절반 남짓이므로 대략 절반 수준
    expect(inst / dep).toBeGreaterThan(0.5)
    expect(inst / dep).toBeLessThan(0.6)
  })
})

describe('installmentCompoundInterest', () => {
  it('같은 조건에서 단리보다 이자가 많다', () => {
    const simple = installmentSimpleInterest(500_000, 4, 36)
    const compound = installmentCompoundInterest(500_000, 4, 36)
    expect(compound).toBeGreaterThan(simple)
  })

  it('기초 납입 가정이라 1개월이면 1회분 이자가 붙는다', () => {
    // 단리와 같은 가정이므로 1개월에서는 두 방식이 일치해야 한다
    expect(installmentCompoundInterest(500_000, 4, 1)).toBeCloseTo(
      installmentSimpleInterest(500_000, 4, 1),
      6,
    )
  })

  it('금리 0이면 0 (0으로 나누기 방어)', () => {
    expect(installmentCompoundInterest(500_000, 0, 12)).toBe(0)
  })

  it('기간이 길수록 단리와의 차이가 벌어진다', () => {
    const gap12 =
      installmentCompoundInterest(500_000, 4, 12) - installmentSimpleInterest(500_000, 4, 12)
    const gap60 =
      installmentCompoundInterest(500_000, 4, 60) - installmentSimpleInterest(500_000, 4, 60)
    expect(gap60).toBeGreaterThan(gap12)
  })
})

describe('depositInterest', () => {
  it('단리: 원금 × 이율 × 연수', () => {
    expect(depositInterest(10_000_000, 4, 12, 'simple')).toBeCloseTo(400_000, 6)
    expect(depositInterest(10_000_000, 4, 24, 'simple')).toBeCloseTo(800_000, 6)
  })

  it('월복리는 단리보다 많다 (1년 초과 구간)', () => {
    const simple = depositInterest(10_000_000, 4, 24, 'simple')
    const compound = depositInterest(10_000_000, 4, 24, 'compound')
    expect(compound).toBeGreaterThan(simple)
  })

  it('원금·기간이 0이면 0', () => {
    expect(depositInterest(0, 4, 12, 'simple')).toBe(0)
    expect(depositInterest(10_000_000, 4, 0, 'compound')).toBe(0)
  })
})

describe('calcSavings · 적금', () => {
  it('납입 원금은 월납입액 × 개월수', () => {
    expect(calcSavings(base).principal).toBe(6_000_000)
  })

  it('세전 이자 130,000원 (월 50만, 4%, 12개월 단리)', () => {
    expect(calcSavings(base).interest).toBe(130_000)
  })

  it('이자소득세 15.4%를 뗀다', () => {
    const r = calcSavings({ ...base, taxed: true })
    expect(r.tax).toBe(20_020) // 130,000 × 0.154
    expect(r.netInterest).toBe(109_980)
    expect(r.total).toBe(6_109_980)
  })

  it('세전 이자 = 세금 + 세후 이자', () => {
    const r = calcSavings({ ...base, taxed: true, months: 37, annualRatePct: 3.3 })
    expect(r.interest).toBe(r.tax + r.netInterest)
  })

  it('실효 연수익률은 표면 금리보다 낮다 (적금의 함정)', () => {
    const r = calcSavings(base)
    expect(r.effectiveAnnualRatePct).toBeLessThan(4)
    expect(r.effectiveAnnualRatePct).toBeGreaterThan(2)
  })
})

describe('calcSavings · 예금', () => {
  const deposit: SavingsInput = { ...base, kind: 'deposit', amount: 10_000_000 }

  it('납입 원금은 예치금 그대로', () => {
    expect(calcSavings(deposit).principal).toBe(10_000_000)
  })

  it('1년 단리 4% → 이자 40만원', () => {
    expect(calcSavings(deposit).interest).toBe(400_000)
  })

  it('예금의 실효 연수익률은 표면 금리와 같다', () => {
    const r = calcSavings(deposit)
    expect(r.effectiveAnnualRatePct).toBeCloseTo(4, 6)
  })
})

describe('calcSavings · 경계값', () => {
  it('금액이 0이면 모든 결과가 0이고 NaN이 없다', () => {
    const r = calcSavings({ ...base, amount: 0 })
    expect(r.total).toBe(0)
    expect(r.returnRate).toBe(0)
    expect(Number.isFinite(r.effectiveAnnualRatePct)).toBe(true)
  })

  it('기간이 0이면 0', () => {
    expect(calcSavings({ ...base, months: 0 }).total).toBe(0)
  })

  it('금리 0%면 원금만 돌려받는다', () => {
    const r = calcSavings({ ...base, annualRatePct: 0 })
    expect(r.interest).toBe(0)
    expect(r.total).toBe(6_000_000)
  })

  it('모든 금액이 원 단위 정수다', () => {
    const r = calcSavings({
      ...base,
      amount: 333_333,
      annualRatePct: 3.77,
      months: 17,
      taxed: true,
    })
    for (const n of [r.principal, r.interest, r.tax, r.netInterest, r.total]) {
      expect(Number.isInteger(n)).toBe(true)
    }
  })
})
