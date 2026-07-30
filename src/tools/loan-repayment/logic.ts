import { monthlyRate, won } from '@/utils/money'

export type RepaymentType = 'equal-total' | 'equal-principal' | 'bullet'

export interface LoanInput {
  /** 대출 원금 (원) */
  principal: number
  /** 연이율 (%) */
  annualRatePct: number
  /** 총 상환 기간 (개월) */
  months: number
  type: RepaymentType
}

export interface ScheduleRow {
  /** 회차 (1부터) */
  no: number
  payment: number
  principal: number
  interest: number
  /** 해당 회차 상환 후 잔액 */
  balance: number
}

export interface LoanResult {
  /** 원리금균등에서의 월 상환액. 나머지 방식은 1회차 상환액 */
  firstPayment: number
  lastPayment: number
  totalPayment: number
  totalInterest: number
  schedule: ScheduleRow[]
}

/**
 * 원리금균등 월 상환액.
 *   M = P·i·(1+i)^n / ((1+i)^n − 1)
 * 무이자(i=0)인 경우 위 식은 0/0 이 되므로 별도 처리한다.
 */
export function monthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0
  const i = monthlyRate(annualRatePct)
  if (i === 0) return principal / months
  const growth = (1 + i) ** months
  return (principal * i * growth) / (growth - 1)
}

/**
 * 상환 스케줄 생성.
 *
 * 각 회차 금액은 원 단위로 확정하고, 마지막 회차에서 잔액을 보정한다.
 * 보정을 넣지 않으면 반올림 오차가 누적되어 원금 합계가 대출금과 몇 원씩 어긋난다.
 */
export function buildSchedule(input: LoanInput): ScheduleRow[] {
  const { principal, annualRatePct, months, type } = input
  if (principal <= 0 || months <= 0) return []

  const i = monthlyRate(annualRatePct)
  const rows: ScheduleRow[] = []
  let balance = won(principal)

  const fixedPayment = type === 'equal-total' ? monthlyPayment(principal, annualRatePct, months) : 0
  const fixedPrincipal = type === 'equal-principal' ? principal / months : 0

  for (let no = 1; no <= months; no += 1) {
    const interest = won(balance * i)
    const isLast = no === months

    let principalPart: number
    if (isLast) {
      // 마지막 회차는 남은 잔액을 전부 상환한다 (반올림 오차 흡수)
      principalPart = balance
    } else if (type === 'equal-total') {
      principalPart = won(fixedPayment) - interest
    } else if (type === 'equal-principal') {
      principalPart = won(fixedPrincipal)
    } else {
      principalPart = 0
    }

    // 이자보다 상환액이 적어 원금이 줄지 않는 경우(초저금리·초장기 조합)를 방어
    principalPart = Math.max(0, Math.min(principalPart, balance))

    balance -= principalPart
    rows.push({
      no,
      payment: principalPart + interest,
      principal: principalPart,
      interest,
      balance,
    })
  }

  return rows
}

export function calcLoanRepayment(input: LoanInput): LoanResult {
  const schedule = buildSchedule(input)

  if (schedule.length === 0) {
    return { firstPayment: 0, lastPayment: 0, totalPayment: 0, totalInterest: 0, schedule: [] }
  }

  const totalInterest = schedule.reduce((sum, r) => sum + r.interest, 0)
  const totalPayment = schedule.reduce((sum, r) => sum + r.payment, 0)

  return {
    firstPayment: schedule[0]?.payment ?? 0,
    lastPayment: schedule[schedule.length - 1]?.payment ?? 0,
    totalPayment,
    totalInterest,
    schedule,
  }
}

export const REPAYMENT_LABELS: Record<RepaymentType, string> = {
  'equal-total': '원리금균등상환',
  'equal-principal': '원금균등상환',
  bullet: '만기일시상환',
}
