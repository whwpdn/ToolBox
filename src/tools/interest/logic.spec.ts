import { describe, expect, it } from 'vitest'
import { calcInterest, compoundAmount, simpleAmount, type InterestInput } from './logic'

const base: InterestInput = {
  principal: 10_000_000,
  annualRatePct: 5,
  months: 12,
  kind: 'simple',
  frequency: 1,
  taxed: false,
}

describe('simpleAmount', () => {
  it('A = P(1 + rt)', () => {
    expect(simpleAmount(10_000_000, 5, 1)).toBe(10_500_000)
    expect(simpleAmount(10_000_000, 5, 3)).toBe(11_500_000)
  })

  it('금리 0이면 원금 그대로', () => {
    expect(simpleAmount(10_000_000, 0, 5)).toBe(10_000_000)
  })
})

describe('compoundAmount', () => {
  it('연복리 A = P(1 + r)^t', () => {
    // 1000만원 5% 3년 연복리 = 10,000,000 × 1.05³ = 11,576,250
    expect(compoundAmount(10_000_000, 5, 3, 1)).toBeCloseTo(11_576_250, 4)
  })

  it('월복리가 연복리보다 많다', () => {
    const yearly = compoundAmount(10_000_000, 5, 3, 1)
    const monthly = compoundAmount(10_000_000, 5, 3, 12)
    expect(monthly).toBeGreaterThan(yearly)
  })

  it('복리 주기가 잦아질수록 연속복리(e^rt)에 수렴한다', () => {
    const continuous = 10_000_000 * Math.E ** (0.05 * 3)
    const daily = compoundAmount(10_000_000, 5, 3, 365)
    expect(daily).toBeLessThan(continuous)
    // 절대 금액이 크므로 상대오차로 비교한다 (일복리는 연속복리의 0.01% 이내)
    expect(daily / continuous).toBeCloseTo(1, 4)
  })

  it('주기가 0 이하면 원금을 그대로 돌려준다 (0으로 나누기 방어)', () => {
    expect(compoundAmount(10_000_000, 5, 3, 0)).toBe(10_000_000)
  })
})

describe('calcInterest · 단리', () => {
  it('1000만원 5% 1년 단리 이자는 50만원', () => {
    const r = calcInterest(base)
    expect(r.interest).toBe(500_000)
    expect(r.total).toBe(10_500_000)
  })

  it('이자소득세 15.4%를 적용한다', () => {
    const r = calcInterest({ ...base, taxed: true })
    expect(r.interest).toBe(500_000)
    expect(r.tax).toBe(77_000) // 500,000 × 0.154
    expect(r.netInterest).toBe(423_000)
    expect(r.total).toBe(10_423_000)
  })

  it('세전 이자 = 세금 + 세후 이자', () => {
    const r = calcInterest({ ...base, taxed: true, months: 37, annualRatePct: 3.7 })
    expect(r.interest).toBe(r.tax + r.netInterest)
  })
})

describe('calcInterest · 복리', () => {
  it('같은 조건에서 복리가 단리보다 이자가 많다', () => {
    const simple = calcInterest({ ...base, months: 36, kind: 'simple' })
    const compound = calcInterest({ ...base, months: 36, kind: 'compound' })
    expect(compound.interest).toBeGreaterThan(simple.interest)
  })

  it('1000만원 5% 3년 연복리 이자는 1,576,250원', () => {
    const r = calcInterest({ ...base, months: 36, kind: 'compound', frequency: 1 })
    expect(r.interest).toBe(1_576_250)
  })

  it('1년 단위에서는 단리와 연복리가 같다', () => {
    const simple = calcInterest({ ...base, months: 12, kind: 'simple' })
    const compound = calcInterest({ ...base, months: 12, kind: 'compound', frequency: 1 })
    expect(compound.interest).toBe(simple.interest)
  })
})

describe('calcInterest · 연차별 추이', () => {
  it('정수 연도만큼 행이 생긴다', () => {
    const r = calcInterest({ ...base, months: 36 })
    expect(r.yearly).toHaveLength(3)
    expect(r.yearly.map((y) => y.year)).toEqual([1, 2, 3])
  })

  it('잔여 개월이 있으면 만기 시점 행이 추가된다', () => {
    const r = calcInterest({ ...base, months: 30 }) // 2년 6개월
    expect(r.yearly).toHaveLength(3)
    expect(r.yearly.at(-1)?.year).toBe(2.5)
  })

  it('잔액이 단조 증가한다', () => {
    const r = calcInterest({ ...base, months: 60, kind: 'compound', frequency: 12 })
    for (let i = 1; i < r.yearly.length; i += 1) {
      expect(r.yearly[i]!.balance).toBeGreaterThan(r.yearly[i - 1]!.balance)
    }
  })

  it('마지막 행 잔액이 세전 총액과 일치한다', () => {
    const r = calcInterest({ ...base, months: 48, kind: 'compound', frequency: 4 })
    expect(r.yearly.at(-1)?.balance).toBe(10_000_000 + r.interest)
  })
})

describe('calcInterest · 경계값', () => {
  it('원금이 0이면 모든 결과가 0이고 NaN이 없다', () => {
    const r = calcInterest({ ...base, principal: 0 })
    expect(r.interest).toBe(0)
    expect(r.total).toBe(0)
    expect(r.returnRate).toBe(0)
    expect(r.yearly).toEqual([])
  })

  it('기간이 0이면 이자가 없다', () => {
    const r = calcInterest({ ...base, months: 0 })
    expect(r.interest).toBe(0)
    expect(r.total).toBe(10_000_000)
  })

  it('금리 0%면 이자가 0이다', () => {
    const r = calcInterest({ ...base, annualRatePct: 0, months: 60 })
    expect(r.interest).toBe(0)
    expect(r.total).toBe(10_000_000)
  })

  it('모든 금액이 원 단위 정수다', () => {
    const r = calcInterest({
      ...base,
      principal: 3_333_333,
      annualRatePct: 3.77,
      months: 17,
      taxed: true,
    })
    expect(Number.isInteger(r.interest)).toBe(true)
    expect(Number.isInteger(r.tax)).toBe(true)
    expect(Number.isInteger(r.netInterest)).toBe(true)
    expect(Number.isInteger(r.total)).toBe(true)
  })
})
