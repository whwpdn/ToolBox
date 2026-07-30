import { describe, expect, it } from 'vitest'
import { monthlyPayment } from '@/tools/loan-repayment/logic'
import { calcLoanLimit, maxPrincipalFromPayment, type LoanLimitInput } from './logic'

const base: LoanLimitInput = {
  annualIncome: 60_000_000,
  existingAnnualPayment: 0,
  existingAnnualInterest: 0,
  housePrice: 0, // 기본은 DSR만 적용
  annualRatePct: 4.5,
  years: 30,
  dsrLimitPct: 40,
  dtiLimitPct: 0, // 기본은 DTI 미적용
  ltvLimitPct: 70,
}

describe('maxPrincipalFromPayment', () => {
  it('monthlyPayment의 역함수다 (왕복 검증)', () => {
    const principal = 300_000_000
    const payment = monthlyPayment(principal, 4.5, 360)
    expect(maxPrincipalFromPayment(payment, 4.5, 360)).toBeCloseTo(principal, 4)
  })

  it('무이자면 월상환액 × 개월수다', () => {
    expect(maxPrincipalFromPayment(1_000_000, 0, 12)).toBe(12_000_000)
  })

  it('상환 여력이 없으면 0', () => {
    expect(maxPrincipalFromPayment(0, 4.5, 360)).toBe(0)
    expect(maxPrincipalFromPayment(-500_000, 4.5, 360)).toBe(0)
  })

  it('기간이 0이면 0', () => {
    expect(maxPrincipalFromPayment(1_000_000, 4.5, 0)).toBe(0)
  })
})

describe('calcLoanLimit · DSR', () => {
  it('연소득 6천만, DSR 40%, 4.5% 30년 → 월 200만원 상환 여력 기준 한도', () => {
    const r = calcLoanLimit(base)
    // 허용 연상환액 = 60,000,000 × 0.4 = 24,000,000 → 월 2,000,000
    // 1억당 월 506,685원이므로 한도 ≈ 2,000,000 / 506,685 × 1억 ≈ 3.947억
    expect(r.byDsr).toBeGreaterThan(390_000_000)
    expect(r.byDsr).toBeLessThan(400_000_000)
    expect(r.binding).toBe('DSR')
  })

  it('한도만큼 대출했을 때 실제 DSR이 한도 비율과 같아진다', () => {
    const r = calcLoanLimit(base)
    expect(r.actualDsr).toBeCloseTo(0.4, 4)
  })

  it('기존 대출이 있으면 그만큼 한도가 줄어든다', () => {
    const without = calcLoanLimit(base)
    const withExisting = calcLoanLimit({ ...base, existingAnnualPayment: 12_000_000 })
    expect(withExisting.byDsr).toBeLessThan(without.byDsr)
    // 여력의 절반(24,000,000 → 12,000,000)이 남으므로 한도도 절반 수준
    expect(withExisting.byDsr).toBeCloseTo(without.byDsr / 2, -5)
  })

  it('기존 대출 상환액이 DSR 한도를 넘으면 한도는 0', () => {
    const r = calcLoanLimit({ ...base, existingAnnualPayment: 30_000_000 })
    expect(r.byDsr).toBe(0)
    expect(r.final).toBe(0)
    expect(r.binding).toBe('NONE')
  })

  it('연소득 0이면 한도는 0이고 NaN이 나오지 않는다', () => {
    const r = calcLoanLimit({ ...base, annualIncome: 0 })
    expect(r.final).toBe(0)
    expect(Number.isFinite(r.actualDsr)).toBe(true)
    expect(r.actualDsr).toBe(0)
  })

  it('금리가 높아지면 한도가 줄어든다', () => {
    const low = calcLoanLimit({ ...base, annualRatePct: 3 })
    const high = calcLoanLimit({ ...base, annualRatePct: 6 })
    expect(high.byDsr).toBeLessThan(low.byDsr)
  })

  it('기간이 길어지면 한도가 늘어난다', () => {
    const short = calcLoanLimit({ ...base, years: 10 })
    const long = calcLoanLimit({ ...base, years: 40 })
    expect(long.byDsr).toBeGreaterThan(short.byDsr)
  })
})

describe('calcLoanLimit · DTI', () => {
  it('dtiLimitPct가 0이면 DTI 기준을 적용하지 않는다', () => {
    const r = calcLoanLimit(base)
    expect(r.byDti).toBeNull()
  })

  it('기존 부채가 없으면 같은 비율의 DSR과 DTI 한도가 같다', () => {
    const r = calcLoanLimit({ ...base, dtiLimitPct: 40 })
    expect(r.byDti).toBe(r.byDsr)
  })

  it('DTI는 기존 부채의 이자만 반영하므로 DSR보다 한도가 크다', () => {
    // 기존 대출 연 원리금 1,200만 중 이자분이 500만인 경우
    const r = calcLoanLimit({
      ...base,
      existingAnnualPayment: 12_000_000,
      existingAnnualInterest: 5_000_000,
      dtiLimitPct: 40,
    })
    expect(r.byDti!).toBeGreaterThan(r.byDsr)
  })

  it('DTI 한도 비율이 높으면 한도도 커진다', () => {
    const strict = calcLoanLimit({ ...base, dtiLimitPct: 40 })
    const loose = calcLoanLimit({ ...base, dtiLimitPct: 60 })
    expect(loose.byDti!).toBeGreaterThan(strict.byDti!)
  })

  it('DTI가 가장 빡빡하면 DTI가 최종 한도가 된다', () => {
    const r = calcLoanLimit({
      ...base,
      dtiLimitPct: 10, // 비정상적으로 낮게 설정해 DTI를 병목으로 만든다
      housePrice: 1_000_000_000,
    })
    expect(r.binding).toBe('DTI')
    expect(r.final).toBe(r.byDti)
  })
})

describe('calcLoanLimit · LTV', () => {
  it('주택가격을 입력하면 LTV 한도를 함께 계산한다', () => {
    const r = calcLoanLimit({ ...base, housePrice: 500_000_000, ltvLimitPct: 70 })
    expect(r.byLtv).toBe(350_000_000)
  })

  it('주택가격이 없으면 LTV 기준을 적용하지 않는다', () => {
    const r = calcLoanLimit(base)
    expect(r.byLtv).toBeNull()
    expect(r.binding).toBe('DSR')
  })

  it('LTV가 더 빡빡하면 LTV가 최종 한도가 된다', () => {
    // 고소득이라 DSR 여력은 크지만 주택가격이 낮은 경우
    const r = calcLoanLimit({
      ...base,
      annualIncome: 200_000_000,
      housePrice: 300_000_000,
      ltvLimitPct: 70,
    })
    expect(r.final).toBe(210_000_000)
    expect(r.binding).toBe('LTV')
    expect(r.byDsr).toBeGreaterThan(r.final)
  })

  it('DSR이 더 빡빡하면 DSR이 최종 한도가 된다', () => {
    const r = calcLoanLimit({
      ...base,
      annualIncome: 40_000_000,
      housePrice: 1_000_000_000,
    })
    expect(r.binding).toBe('DSR')
    expect(r.final).toBe(r.byDsr)
  })

  it('최종 한도는 항상 적용 기준들의 최솟값이다', () => {
    const r = calcLoanLimit({ ...base, housePrice: 600_000_000, dtiLimitPct: 50 })
    const applicable = [r.byDsr, r.byDti, r.byLtv].filter((v): v is number => v !== null)
    expect(r.final).toBe(Math.min(...applicable))
  })

  it('세 기준을 모두 적용해도 최솟값 규칙이 유지된다', () => {
    const cases: Array<Partial<LoanLimitInput>> = [
      { annualIncome: 30_000_000, housePrice: 900_000_000 },
      { annualIncome: 300_000_000, housePrice: 200_000_000 },
      { annualIncome: 80_000_000, housePrice: 500_000_000, existingAnnualPayment: 6_000_000 },
    ]
    for (const patch of cases) {
      const r = calcLoanLimit({ ...base, dtiLimitPct: 50, ...patch })
      const applicable = [r.byDsr, r.byDti, r.byLtv].filter((v): v is number => v !== null)
      expect(r.final).toBe(Math.min(...applicable))
    }
  })
})

describe('calcLoanLimit · 반환값 정합성', () => {
  it('금액은 모두 원 단위 정수다', () => {
    const r = calcLoanLimit({ ...base, housePrice: 500_000_000 })
    expect(Number.isInteger(r.byDsr)).toBe(true)
    expect(Number.isInteger(r.byLtv)).toBe(true)
    expect(Number.isInteger(r.final)).toBe(true)
    expect(Number.isInteger(r.monthlyPayment)).toBe(true)
  })

  it('월 상환액은 최종 한도에 대응한다', () => {
    const r = calcLoanLimit(base)
    expect(r.monthlyPayment).toBe(Math.round(monthlyPayment(r.final, 4.5, 360)))
  })
})
