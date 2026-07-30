import { monthlyPayment } from '@/tools/loan-repayment/logic'
import { won } from '@/utils/money'

export interface LoanLimitInput {
  /** 연소득 (원) */
  annualIncome: number
  /** 기존 대출의 연간 원리금(원금+이자) 상환액 (원) — DSR 산정에 쓰인다 */
  existingAnnualPayment: number
  /** 기존 대출의 연간 이자 상환액 (원) — DTI 산정에 쓰인다 */
  existingAnnualInterest: number
  /** 주택 가격 (원). 0이면 LTV 기준을 적용하지 않는다 */
  housePrice: number
  /** 신규 대출 연이율 (%) */
  annualRatePct: number
  /** 신규 대출 기간 (년) */
  years: number
  dsrLimitPct: number
  /** 0이면 DTI 기준을 적용하지 않는다 */
  dtiLimitPct: number
  ltvLimitPct: number
}

export type BindingRule = 'DSR' | 'DTI' | 'LTV' | 'NONE'

export interface LoanLimitResult {
  /** DSR 규제만 고려한 최대 대출금 */
  byDsr: number
  /** DTI 규제만 고려한 최대 대출금 (dtiLimitPct 가 0이면 null) */
  byDti: number | null
  /** LTV 규제만 고려한 최대 대출금 (주택가격 0이면 null) */
  byLtv: number | null
  /** 실제 한도 = 적용 가능한 기준들의 최솟값 */
  final: number
  /** 최종 한도를 결정한 기준 */
  binding: BindingRule
  /** 최종 한도로 대출했을 때의 월 상환액 */
  monthlyPayment: number
  /** 최종 한도 기준 실제 DSR 비율 (0.4 = 40%) */
  actualDsr: number
}

/**
 * 상환 여력(월 상환액)에서 최대 원금을 역산한다.
 * monthlyPayment()의 역함수:
 *   P = M × ((1+i)^n − 1) ÷ (i × (1+i)^n)
 */
export function maxPrincipalFromPayment(
  monthlyBudget: number,
  annualRatePct: number,
  months: number,
): number {
  if (monthlyBudget <= 0 || months <= 0) return 0
  const i = annualRatePct / 100 / 12
  if (i === 0) return monthlyBudget * months
  const growth = (1 + i) ** months
  return (monthlyBudget * (growth - 1)) / (i * growth)
}

/**
 * 대출 한도 역산.
 *
 * 세 가지 규제를 각각 계산하고 가장 낮은 값을 실제 한도로 제시한다.
 *
 * - DSR = (신규 연 원리금 + 기존 연 원리금) ÷ 연소득
 * - DTI = (신규 연 원리금 + 기존 연 **이자**) ÷ 연소득
 *   → 기존 부채의 원금 상환분을 보지 않으므로 보통 DSR보다 느슨하다
 * - LTV = 대출금 ÷ 주택가격
 *
 * 소득 기준(DSR·DTI)은 허용 연상환액을 구한 뒤 원리금균등 공식을 역산해 원금을 얻는다.
 *
 * 실무의 DSR은 대출 종류별로 인정 만기를 다르게 적용(신용대출 5년 등)하는 등 규칙이 더
 * 복잡하다. 여기서는 신규 대출 조건 하나만으로 단순화한 참고 계산이다.
 */
export function calcLoanLimit(input: LoanLimitInput): LoanLimitResult {
  const {
    annualIncome,
    existingAnnualPayment,
    existingAnnualInterest,
    housePrice,
    annualRatePct,
    years,
  } = input
  const months = Math.round(years * 12)

  /** 허용 연상환액 → 최대 원금 */
  const principalFor = (allowedAnnual: number) =>
    won(Math.max(0, maxPrincipalFromPayment(allowedAnnual / 12, annualRatePct, months)))

  const byDsr = principalFor(annualIncome * (input.dsrLimitPct / 100) - existingAnnualPayment)

  // DTI는 기존 부채 중 이자만 반영한다
  const byDti =
    input.dtiLimitPct > 0
      ? principalFor(annualIncome * (input.dtiLimitPct / 100) - existingAnnualInterest)
      : null

  // 주택 가격을 입력하지 않았으면 담보 기준을 적용하지 않는다(신용대출 등)
  const byLtv = housePrice > 0 ? won(housePrice * (input.ltvLimitPct / 100)) : null

  const candidates: Array<{ rule: BindingRule; value: number }> = [{ rule: 'DSR', value: byDsr }]
  if (byDti !== null) candidates.push({ rule: 'DTI', value: byDti })
  if (byLtv !== null) candidates.push({ rule: 'LTV', value: byLtv })

  // 규제 기준 중 가장 낮은 값이 실제 한도가 된다
  const tightest = candidates.reduce((min, c) => (c.value < min.value ? c : min))
  const final = Math.max(0, tightest.value)

  const payment = won(monthlyPayment(final, annualRatePct, months))
  const actualDsr = annualIncome > 0 ? (payment * 12 + existingAnnualPayment) / annualIncome : 0

  return {
    byDsr,
    byDti,
    byLtv,
    final,
    binding: final === 0 ? 'NONE' : tightest.rule,
    monthlyPayment: payment,
    actualDsr,
  }
}
