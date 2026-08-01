import { won } from '@/utils/money'
import { INTEREST_TAX_RATE } from '@/core/finance-policy'

/** 예금(목돈 예치) / 적금(매월 납입) */
export type SavingsKind = 'deposit' | 'installment'

/** 적금 이자 방식 */
export type SavingsInterest = 'simple' | 'compound'

export interface SavingsInput {
  kind: SavingsKind
  /** 예금이면 예치금, 적금이면 월 납입액 (원) */
  amount: number
  /** 연이율 (%) */
  annualRatePct: number
  months: number
  interest: SavingsInterest
  /** 이자소득세 15.4% 적용 여부 */
  taxed: boolean
}

export interface SavingsResult {
  /** 납입 원금 총액 */
  principal: number
  /** 세전 이자 */
  interest: number
  tax: number
  netInterest: number
  /** 세후 만기 수령액 */
  total: number
  /** 원금 대비 세후 수익률 */
  returnRate: number
  /**
   * 적금의 '실효 수익률'.
   * 적금은 매월 납입하므로 평균 예치 기간이 절반 남짓이다. 그래서 같은 금리라도
   * 예금보다 이자가 훨씬 적다. 이 값을 보여줘야 "금리 4%인데 왜 4%가 아니지?"를 막는다.
   */
  effectiveAnnualRatePct: number
}

/**
 * 적금 단리 이자.
 *
 * 첫 회차는 n개월, 둘째는 n-1개월... 예치되므로
 *   이자 = 월납입액 × 월이율 × (n + (n-1) + ... + 1)
 *        = 월납입액 × 월이율 × n(n+1)/2
 * 은행 적금 이자 계산의 표준 방식이다.
 */
export function installmentSimpleInterest(
  monthly: number,
  annualRatePct: number,
  months: number,
): number {
  if (monthly <= 0 || months <= 0) return 0
  const monthlyRate = annualRatePct / 100 / 12
  return monthly * monthlyRate * ((months * (months + 1)) / 2)
}

/**
 * 적금 월복리 이자.
 *
 * 단리와 동일하게 **기초 납입**(매월 초에 납입 → 첫 회차는 n개월간 예치)을 가정한다.
 * 두 방식의 가정이 다르면 단리·복리를 나란히 비교할 수 없다.
 *
 *   기말 기준 적립액 = P × ((1+i)^n − 1) ÷ i
 *   기초 납입은 한 달씩 더 예치되므로 여기에 (1+i)를 곱한다
 *   이자 = 적립액 − 납입 원금(P × n)
 */
export function installmentCompoundInterest(
  monthly: number,
  annualRatePct: number,
  months: number,
): number {
  if (monthly <= 0 || months <= 0) return 0
  const i = annualRatePct / 100 / 12
  if (i === 0) return 0

  const futureValue = monthly * (((1 + i) ** months - 1) / i) * (1 + i)
  return futureValue - monthly * months
}

/** 예금 이자 (목돈을 한 번에 예치) */
export function depositInterest(
  principal: number,
  annualRatePct: number,
  months: number,
  kind: SavingsInterest,
): number {
  if (principal <= 0 || months <= 0) return 0
  const years = months / 12
  if (kind === 'simple') return principal * (annualRatePct / 100) * years
  const i = annualRatePct / 100 / 12
  return principal * (1 + i) ** months - principal
}

export function calcSavings(input: SavingsInput): SavingsResult {
  const { kind, amount, annualRatePct, months, interest: mode, taxed } = input

  const empty: SavingsResult = {
    principal: 0,
    interest: 0,
    tax: 0,
    netInterest: 0,
    total: 0,
    returnRate: 0,
    effectiveAnnualRatePct: 0,
  }
  if (amount <= 0 || months <= 0) return empty

  const principal = kind === 'deposit' ? won(amount) : won(amount * months)

  const grossInterest = won(
    kind === 'deposit'
      ? depositInterest(amount, annualRatePct, months, mode)
      : mode === 'simple'
        ? installmentSimpleInterest(amount, annualRatePct, months)
        : installmentCompoundInterest(amount, annualRatePct, months),
  )

  const tax = taxed ? won(grossInterest * INTEREST_TAX_RATE) : 0
  const netInterest = grossInterest - tax

  // 납입 원금을 만기까지 예치했다고 가정했을 때의 연환산 수익률
  const years = months / 12
  const effectiveAnnualRatePct =
    principal > 0 && years > 0 ? (grossInterest / principal / years) * 100 : 0

  return {
    principal,
    interest: grossInterest,
    tax,
    netInterest,
    total: principal + netInterest,
    returnRate: netInterest / principal,
    effectiveAnnualRatePct,
  }
}

export const KIND_LABELS: Record<SavingsKind, string> = {
  deposit: '예금 (목돈 예치)',
  installment: '적금 (매월 납입)',
}

export const INTEREST_LABELS: Record<SavingsInterest, string> = {
  simple: '단리',
  compound: '월복리',
}
