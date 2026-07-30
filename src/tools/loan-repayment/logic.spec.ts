import { describe, expect, it } from 'vitest'
import { buildSchedule, calcLoanRepayment, monthlyPayment, type LoanInput } from './logic'

const base: LoanInput = {
  principal: 100_000_000,
  annualRatePct: 4.5,
  months: 360,
  type: 'equal-total',
}

describe('monthlyPayment', () => {
  it('엑셀 PMT와 일치한다 (1억 / 4.5% / 30년)', () => {
    // Excel: PMT(4.5%/12, 360, -100000000) = 506,685.31
    expect(monthlyPayment(100_000_000, 4.5, 360)).toBeCloseTo(506685.31, 2)
  })

  it('엑셀 PMT와 일치한다 (3억 / 3.5% / 20년)', () => {
    expect(Math.round(monthlyPayment(300_000_000, 3.5, 240))).toBe(1_739_879)
  })

  it('엑셀 PMT와 일치한다 (5천만 / 6% / 5년)', () => {
    expect(Math.round(monthlyPayment(50_000_000, 6, 60))).toBe(966_640)
  })

  it('무이자면 원금을 기간으로 나눈 값이다 (0으로 나누기 방어)', () => {
    expect(monthlyPayment(12_000_000, 0, 12)).toBe(1_000_000)
  })

  it('원금이나 기간이 0이면 0', () => {
    expect(monthlyPayment(0, 4.5, 360)).toBe(0)
    expect(monthlyPayment(100_000_000, 4.5, 0)).toBe(0)
    expect(monthlyPayment(100_000_000, 4.5, -12)).toBe(0)
  })
})

describe('buildSchedule · 원리금균등', () => {
  const schedule = buildSchedule(base)

  it('회차 수가 기간과 같다', () => {
    expect(schedule).toHaveLength(360)
  })

  it('원금 합계가 대출금과 정확히 일치한다 (반올림 오차 보정)', () => {
    const sumPrincipal = schedule.reduce((s, r) => s + r.principal, 0)
    expect(sumPrincipal).toBe(100_000_000)
  })

  it('마지막 회차 잔액이 정확히 0이다', () => {
    expect(schedule.at(-1)?.balance).toBe(0)
  })

  it('모든 회차 금액이 정수(원 단위)다', () => {
    for (const row of schedule) {
      expect(Number.isInteger(row.payment)).toBe(true)
      expect(Number.isInteger(row.principal)).toBe(true)
      expect(Number.isInteger(row.interest)).toBe(true)
      expect(Number.isInteger(row.balance)).toBe(true)
    }
  })

  it('잔액이 단조 감소한다', () => {
    for (let i = 1; i < schedule.length; i += 1) {
      expect(schedule[i]!.balance).toBeLessThanOrEqual(schedule[i - 1]!.balance)
    }
  })

  it('회차가 갈수록 이자는 줄고 원금은 늘어난다', () => {
    expect(schedule[0]!.interest).toBeGreaterThan(schedule[359]!.interest)
    expect(schedule[0]!.principal).toBeLessThan(schedule[359]!.principal)
  })

  it('1회차 이자는 대출금 × 월이율이다', () => {
    // 100,000,000 × (4.5 / 100 / 12) = 375,000
    expect(schedule[0]!.interest).toBe(375_000)
  })
})

describe('buildSchedule · 원금균등', () => {
  const schedule = buildSchedule({ ...base, type: 'equal-principal' })

  it('원금 합계가 대출금과 일치한다', () => {
    expect(schedule.reduce((s, r) => s + r.principal, 0)).toBe(100_000_000)
  })

  it('매 회차 원금이 일정하다 (마지막 보정 회차 제외)', () => {
    const expected = Math.round(100_000_000 / 360)
    for (let i = 0; i < 359; i += 1) {
      expect(schedule[i]!.principal).toBe(expected)
    }
  })

  it('상환액이 점점 줄어든다', () => {
    expect(schedule[0]!.payment).toBeGreaterThan(schedule[359]!.payment)
  })

  it('원리금균등보다 총이자가 적다', () => {
    const equalTotal = calcLoanRepayment(base).totalInterest
    const equalPrincipal = calcLoanRepayment({ ...base, type: 'equal-principal' }).totalInterest
    expect(equalPrincipal).toBeLessThan(equalTotal)
  })
})

describe('buildSchedule · 만기일시', () => {
  const schedule = buildSchedule({ ...base, type: 'bullet' })

  it('마지막 회차 전까지는 이자만 낸다', () => {
    expect(schedule[0]!.principal).toBe(0)
    expect(schedule[0]!.payment).toBe(375_000)
    expect(schedule[358]!.principal).toBe(0)
  })

  it('마지막 회차에 원금 전액을 상환한다', () => {
    expect(schedule[359]!.principal).toBe(100_000_000)
    expect(schedule[359]!.balance).toBe(0)
  })

  it('총이자가 세 방식 중 가장 많다', () => {
    const bullet = calcLoanRepayment({ ...base, type: 'bullet' }).totalInterest
    const equalTotal = calcLoanRepayment(base).totalInterest
    expect(bullet).toBeGreaterThan(equalTotal)
  })
})

describe('calcLoanRepayment', () => {
  it('총상환액 = 원금 + 총이자', () => {
    const r = calcLoanRepayment(base)
    expect(r.totalPayment).toBe(100_000_000 + r.totalInterest)
  })

  it('1억 4.5% 30년 원리금균등의 월 상환액은 506,685원이다', () => {
    const r = calcLoanRepayment(base)
    expect(r.firstPayment).toBe(506_685)
  })

  it('입력이 비었으면 0으로 채운 결과를 돌려준다 (NaN 노출 방지)', () => {
    const r = calcLoanRepayment({ ...base, principal: 0 })
    expect(r).toEqual({
      firstPayment: 0,
      lastPayment: 0,
      totalPayment: 0,
      totalInterest: 0,
      schedule: [],
    })
  })

  it('금리 0%면 총이자가 0이고 원금만 나눠 갚는다', () => {
    const r = calcLoanRepayment({ ...base, annualRatePct: 0, months: 10, principal: 10_000_000 })
    expect(r.totalInterest).toBe(0)
    expect(r.firstPayment).toBe(1_000_000)
    expect(r.totalPayment).toBe(10_000_000)
  })

  it('기간이 1개월이면 한 번에 전액 상환한다', () => {
    const r = calcLoanRepayment({ ...base, months: 1 })
    expect(r.schedule).toHaveLength(1)
    expect(r.schedule[0]!.principal).toBe(100_000_000)
    expect(r.schedule[0]!.interest).toBe(375_000)
  })
})
