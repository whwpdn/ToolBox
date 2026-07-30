import { won } from '@/utils/money'
import { INTEREST_TAX_RATE } from '@/core/finance-policy'

export type InterestKind = 'simple' | 'compound'

/** 복리 계산 주기 (연 n회) */
export type CompoundFrequency = 1 | 2 | 4 | 12 | 365

export interface InterestInput {
  /** 원금 (원) */
  principal: number
  /** 연이율 (%) */
  annualRatePct: number
  /** 예치 기간 (개월) */
  months: number
  kind: InterestKind
  frequency: CompoundFrequency
  /** true면 이자소득세 15.4%를 뗀다 */
  taxed: boolean
}

export interface YearRow {
  /** 경과 연차 (1부터). 마지막 행은 잔여 개월이 반영된 최종 시점 */
  year: number
  balance: number
  interest: number
}

export interface InterestResult {
  /** 세전 이자 */
  interest: number
  /** 이자소득세 */
  tax: number
  /** 세후 수령 이자 */
  netInterest: number
  /** 세후 총 수령액 (원금 + 세후 이자) */
  total: number
  /** 원금 대비 총 수익률 (0.05 = 5%) */
  returnRate: number
  yearly: YearRow[]
}

/** 단리: A = P(1 + r·t) */
export function simpleAmount(principal: number, annualRatePct: number, years: number): number {
  return principal * (1 + (annualRatePct / 100) * years)
}

/** 복리: A = P(1 + r/n)^(n·t) */
export function compoundAmount(
  principal: number,
  annualRatePct: number,
  years: number,
  frequency: number,
): number {
  if (frequency <= 0) return principal
  const r = annualRatePct / 100
  return principal * (1 + r / frequency) ** (frequency * years)
}

function amountAt(input: InterestInput, years: number): number {
  return input.kind === 'simple'
    ? simpleAmount(input.principal, input.annualRatePct, years)
    : compoundAmount(input.principal, input.annualRatePct, years, input.frequency)
}

export function calcInterest(input: InterestInput): InterestResult {
  const { principal, months, taxed } = input

  if (principal <= 0 || months <= 0) {
    return { interest: 0, tax: 0, netInterest: 0, total: won(principal), returnRate: 0, yearly: [] }
  }

  const years = months / 12
  const grossInterest = won(amountAt(input, years) - principal)
  const tax = taxed ? won(grossInterest * INTEREST_TAX_RATE) : 0
  const netInterest = grossInterest - tax

  // 연차별 추이. 마지막 행은 잔여 개월을 반영한 실제 만기 시점으로 맞춘다.
  const yearly: YearRow[] = []
  const fullYears = Math.floor(years)
  for (let y = 1; y <= fullYears; y += 1) {
    const balance = won(amountAt(input, y))
    yearly.push({ year: y, balance, interest: balance - won(principal) })
  }
  if (years > fullYears) {
    const balance = won(amountAt(input, years))
    yearly.push({ year: Number(years.toFixed(2)), balance, interest: balance - won(principal) })
  }

  return {
    interest: grossInterest,
    tax,
    netInterest,
    total: won(principal) + netInterest,
    returnRate: netInterest / principal,
    yearly,
  }
}

export const KIND_LABELS: Record<InterestKind, string> = {
  simple: '단리',
  compound: '복리',
}

export const FREQUENCY_LABELS: Record<CompoundFrequency, string> = {
  1: '연 1회 (연복리)',
  2: '연 2회 (반기복리)',
  4: '연 4회 (분기복리)',
  12: '연 12회 (월복리)',
  365: '연 365회 (일복리)',
}
