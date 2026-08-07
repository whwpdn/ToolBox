import { describe, expect, it } from 'vitest'
import { calcBrokerageFee, convertedDeposit, type BrokerageInput } from './logic'

const base: BrokerageInput = {
  dealType: 'sale',
  price: 500_000_000,
  monthlyRent: 0,
  includeVat: false,
}

describe('convertedDeposit · 월세 환산', () => {
  it('월세가 없으면 보증금 그대로', () => {
    expect(convertedDeposit(100_000_000, 0)).toEqual({ amount: 100_000_000, multiplier: 0 })
  })

  it('기본은 보증금 + 월세 × 100', () => {
    const r = convertedDeposit(100_000_000, 500_000)
    expect(r.amount).toBe(150_000_000)
    expect(r.multiplier).toBe(100)
  })

  it('환산액이 5천만원 미만이면 배수를 70으로 낮춘다', () => {
    // 1000만 + 30만×100 = 4000만 < 5000만 → 70배로 재계산
    const r = convertedDeposit(10_000_000, 300_000)
    expect(r.multiplier).toBe(70)
    expect(r.amount).toBe(10_000_000 + 300_000 * 70)
  })

  it('경계: 5천만원 정확히는 100배 유지', () => {
    // 0 + 50만×100 = 5000만
    expect(convertedDeposit(0, 500_000).multiplier).toBe(100)
  })
})

describe('calcBrokerageFee · 매매', () => {
  it('5억 매매 → 0.4% = 200만원', () => {
    const r = calcBrokerageFee(base)
    expect(r.rate).toBe(0.004)
    expect(r.fee).toBe(2_000_000)
    expect(r.capped).toBe(false)
  })

  it('10억 매매 → 0.5% = 500만원', () => {
    expect(calcBrokerageFee({ ...base, price: 1_000_000_000 }).fee).toBe(5_000_000)
  })

  it('13억 매매 → 0.6%', () => {
    const r = calcBrokerageFee({ ...base, price: 1_300_000_000 })
    expect(r.rate).toBe(0.006)
    expect(r.fee).toBe(7_800_000)
  })

  it('15억 이상 → 0.7%', () => {
    const r = calcBrokerageFee({ ...base, price: 2_000_000_000 })
    expect(r.rate).toBe(0.007)
    expect(r.fee).toBe(14_000_000)
  })

  it('저가 구간은 한도액이 적용된다', () => {
    // 4천만 × 0.6% = 24만 → 한도 25만 미만이라 그대로
    const under = calcBrokerageFee({ ...base, price: 40_000_000 })
    expect(under.capped).toBe(false)
    expect(under.fee).toBe(240_000)

    // 4900만 × 0.6% = 29.4만 → 한도 25만으로 잘림
    const capped = calcBrokerageFee({ ...base, price: 49_000_000 })
    expect(capped.capped).toBe(true)
    expect(capped.fee).toBe(250_000)
  })

  it('5천만~2억 구간 한도액 80만원', () => {
    // 1.9억 × 0.5% = 95만 → 한도 80만
    const r = calcBrokerageFee({ ...base, price: 190_000_000 })
    expect(r.capped).toBe(true)
    expect(r.fee).toBe(800_000)
  })

  it('매매는 월세를 무시한다', () => {
    const withRent = calcBrokerageFee({ ...base, monthlyRent: 1_000_000 })
    expect(withRent.dealAmount).toBe(500_000_000)
    expect(withRent.converted).toBe(false)
  })
})

describe('calcBrokerageFee · 임대차', () => {
  const lease: BrokerageInput = { ...base, dealType: 'lease' }

  it('전세 3억 → 0.3% = 90만원', () => {
    const r = calcBrokerageFee({ ...lease, price: 300_000_000 })
    expect(r.rate).toBe(0.003)
    expect(r.fee).toBe(900_000)
  })

  it('월세는 환산보증금으로 요율을 정한다', () => {
    // 보증금 1억 + 월세 50만 → 환산 1.5억 → 0.3%
    const r = calcBrokerageFee({ ...lease, price: 100_000_000, monthlyRent: 500_000 })
    expect(r.dealAmount).toBe(150_000_000)
    expect(r.converted).toBe(true)
    expect(r.multiplier).toBe(100)
    expect(r.fee).toBe(450_000)
  })

  it('임대차 저가 구간 한도액 20만원', () => {
    // 4900만 × 0.5% = 24.5만 → 한도 20만
    const r = calcBrokerageFee({ ...lease, price: 49_000_000 })
    expect(r.capped).toBe(true)
    expect(r.fee).toBe(200_000)
  })

  it('임대차 요율이 매매보다 낮다 (같은 금액 기준)', () => {
    const sale = calcBrokerageFee({ ...base, price: 300_000_000 })
    const rent = calcBrokerageFee({ ...lease, price: 300_000_000 })
    expect(rent.fee).toBeLessThan(sale.fee)
  })
})

describe('calcBrokerageFee · 부가세', () => {
  it('포함하면 10%가 붙는다', () => {
    const r = calcBrokerageFee({ ...base, includeVat: true })
    expect(r.vat).toBe(200_000)
    expect(r.total).toBe(2_200_000)
  })

  it('제외하면 부가세 0', () => {
    const r = calcBrokerageFee(base)
    expect(r.vat).toBe(0)
    expect(r.total).toBe(r.fee)
  })

  it('총액 = 보수 + 부가세', () => {
    for (const price of [30_000_000, 500_000_000, 1_600_000_000]) {
      const r = calcBrokerageFee({ ...base, price, includeVat: true })
      expect(r.total).toBe(r.fee + r.vat)
    }
  })
})

describe('calcBrokerageFee · 경계값', () => {
  it('금액이 0 이하면 모두 0', () => {
    expect(calcBrokerageFee({ ...base, price: 0 }).total).toBe(0)
    expect(calcBrokerageFee({ ...base, price: -1 }).fee).toBe(0)
  })

  it('음수 월세는 0으로 본다', () => {
    const r = calcBrokerageFee({ ...base, dealType: 'lease', price: 100_000_000, monthlyRent: -5 })
    expect(r.dealAmount).toBe(100_000_000)
  })

  it('모든 금액이 원 단위 정수다', () => {
    const r = calcBrokerageFee({ ...base, price: 333_333_333, includeVat: true })
    for (const n of [r.dealAmount, r.fee, r.vat, r.total]) {
      expect(Number.isInteger(n)).toBe(true)
    }
  })

  it('구간 경계에서 요율이 올라간다', () => {
    expect(calcBrokerageFee({ ...base, price: 899_999_999 }).rate).toBe(0.004)
    expect(calcBrokerageFee({ ...base, price: 900_000_000 }).rate).toBe(0.005)
  })
})
