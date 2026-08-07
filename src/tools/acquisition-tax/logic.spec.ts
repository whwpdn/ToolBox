import { describe, expect, it } from 'vitest'
import { baseRateFor, calcAcquisitionTax, type AcquisitionInput } from './logic'

const base: AcquisitionInput = {
  price: 500_000_000,
  areaM2: 84,
  houseCount: 'first',
  regulated: false,
}

describe('baseRateFor · 기본 세율 구간', () => {
  it('6억 이하는 1%', () => {
    expect(baseRateFor(100_000_000)).toBe(0.01)
    expect(baseRateFor(600_000_000)).toBe(0.01)
  })

  it('9억 초과는 3%', () => {
    expect(baseRateFor(900_000_001)).toBe(0.03)
    expect(baseRateFor(2_000_000_000)).toBe(0.03)
  })

  it('6~9억은 선형으로 증가한다', () => {
    // 7.5억(중간 지점)이면 대략 2%
    expect(baseRateFor(750_000_000)).toBeCloseTo(0.02, 4)
    // 구간 양 끝에서 1%와 3%에 수렴
    expect(baseRateFor(600_000_001)).toBeCloseTo(0.01, 4)
    expect(baseRateFor(900_000_000)).toBeCloseTo(0.03, 4)
  })

  it('구간 안에서 단조 증가한다', () => {
    let prev = 0
    for (let eok = 6; eok <= 9; eok += 0.25) {
      const rate = baseRateFor(eok * 100_000_000)
      expect(rate).toBeGreaterThanOrEqual(prev)
      prev = rate
    }
  })
})

describe('calcAcquisitionTax · 1주택 기본', () => {
  it('5억 · 84㎡ → 취득세 1%, 농특세 면제', () => {
    const r = calcAcquisitionTax(base)
    expect(r.baseRate).toBe(0.01)
    expect(r.baseTax).toBe(5_000_000)
    expect(r.eduTax).toBe(500_000) // 본세율의 1/10 = 0.1%
    expect(r.ruralTax).toBe(0)
    expect(r.ruralExempt).toBe(true)
    expect(r.total).toBe(5_500_000)
  })

  it('85㎡ 초과면 농특세 0.2%가 붙는다', () => {
    const r = calcAcquisitionTax({ ...base, areaM2: 114 })
    expect(r.ruralExempt).toBe(false)
    expect(r.ruralTax).toBe(1_000_000) // 5억 × 0.2%
    expect(r.total).toBe(6_500_000)
  })

  it('85㎡ 정확히는 면제 (국민주택 규모 이하)', () => {
    expect(calcAcquisitionTax({ ...base, areaM2: 85 }).ruralExempt).toBe(true)
    expect(calcAcquisitionTax({ ...base, areaM2: 85.01 }).ruralExempt).toBe(false)
  })

  it('10억 · 84㎡ → 3% 구간', () => {
    const r = calcAcquisitionTax({ ...base, price: 1_000_000_000 })
    expect(r.baseRate).toBe(0.03)
    expect(r.baseTax).toBe(30_000_000)
    expect(r.eduTax).toBe(3_000_000)
    expect(r.total).toBe(33_000_000)
  })
})

describe('calcAcquisitionTax · 중과', () => {
  it('비조정지역 2주택은 중과되지 않는다', () => {
    const r = calcAcquisitionTax({ ...base, houseCount: 'second', regulated: false })
    expect(r.heavy).toBe(false)
    expect(r.baseRate).toBe(0.01)
  })

  it('조정지역 2주택은 8%', () => {
    const r = calcAcquisitionTax({ ...base, houseCount: 'second', regulated: true })
    expect(r.heavy).toBe(true)
    expect(r.baseRate).toBe(0.08)
    expect(r.baseTax).toBe(40_000_000)
    expect(r.eduTax).toBe(2_000_000) // 중과 구간 지방교육세 0.4%
  })

  it('조정지역 3주택 이상은 12%', () => {
    const r = calcAcquisitionTax({ ...base, houseCount: 'thirdPlus', regulated: true })
    expect(r.baseRate).toBe(0.12)
    expect(r.baseTax).toBe(60_000_000)
  })

  it('비조정지역 3주택 이상은 8%', () => {
    const r = calcAcquisitionTax({ ...base, houseCount: 'thirdPlus', regulated: false })
    expect(r.baseRate).toBe(0.08)
  })

  it('중과 구간에서도 85㎡ 이하는 농특세 면제', () => {
    const r = calcAcquisitionTax({ ...base, houseCount: 'thirdPlus', regulated: true })
    expect(r.ruralTax).toBe(0)
  })

  it('중과 구간 85㎡ 초과 농특세율 (8% → 0.6%, 12% → 1.0%)', () => {
    const eight = calcAcquisitionTax({
      ...base,
      areaM2: 114,
      houseCount: 'second',
      regulated: true,
    })
    expect(eight.ruralTax).toBe(3_000_000) // 5억 × 0.6%

    const twelve = calcAcquisitionTax({
      ...base,
      areaM2: 114,
      houseCount: 'thirdPlus',
      regulated: true,
    })
    expect(twelve.ruralTax).toBe(5_000_000) // 5억 × 1.0%
  })
})

describe('calcAcquisitionTax · 정합성', () => {
  it('총액 = 본세 + 지방교육세 + 농특세', () => {
    for (const price of [300_000_000, 700_000_000, 1_500_000_000]) {
      for (const areaM2 of [59, 114]) {
        const r = calcAcquisitionTax({ ...base, price, areaM2 })
        expect(r.total).toBe(r.baseTax + r.eduTax + r.ruralTax)
      }
    }
  })

  it('실효세율이 취득가 대비 총액과 일치한다', () => {
    const r = calcAcquisitionTax({ ...base, price: 700_000_000 })
    expect(r.effectiveRate).toBeCloseTo(r.total / 700_000_000, 12)
  })

  it('모든 금액이 원 단위 정수다', () => {
    const r = calcAcquisitionTax({ ...base, price: 733_333_333, areaM2: 114 })
    for (const n of [r.baseTax, r.eduTax, r.ruralTax, r.total]) {
      expect(Number.isInteger(n)).toBe(true)
    }
  })

  it('가격이 0 이하면 모두 0이고 NaN이 없다', () => {
    const r = calcAcquisitionTax({ ...base, price: 0 })
    expect(r.total).toBe(0)
    expect(Number.isFinite(r.effectiveRate)).toBe(true)
  })

  it('면적을 0으로 두면 농특세를 부과한다 (면제 확신이 없을 때 안전한 쪽)', () => {
    expect(calcAcquisitionTax({ ...base, areaM2: 0 }).ruralExempt).toBe(false)
  })
})
