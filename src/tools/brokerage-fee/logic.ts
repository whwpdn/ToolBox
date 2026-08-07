import { won } from '@/utils/money'
import { BROKERAGE_FEE_AS_OF, VAT_RATE } from '@/core/finance-policy'

/**
 * 부동산 중개보수(중개수수료) 상한 계산.
 *
 * 법에 정해진 것은 '상한'이지 정가가 아니다. 실제 보수는 상한 안에서 협의로 정한다.
 * 이 도구가 계산하는 값은 "이보다 더 받으면 안 되는 금액"이다.
 *
 * 구간별로 상한요율이 다르고, 낮은 구간에는 '한도액'이 따로 있다.
 * 한도액이 있는 구간은 `거래금액 × 요율` 과 `한도액` 중 **작은 쪽**이 상한이다.
 */

export type DealType = 'sale' | 'lease'

interface Bracket {
  /** 이 금액 미만까지 적용 (마지막 구간은 Infinity) */
  under: number
  /** 상한요율 (0.005 = 0.5%) */
  rate: number
  /** 한도액. 없으면 null */
  cap: number | null
  label: string
}

/** 주택 매매·교환 상한요율 */
const SALE_BRACKETS: Bracket[] = [
  { under: 50_000_000, rate: 0.006, cap: 250_000, label: '5천만원 미만' },
  { under: 200_000_000, rate: 0.005, cap: 800_000, label: '5천만 ~ 2억' },
  { under: 900_000_000, rate: 0.004, cap: null, label: '2억 ~ 9억' },
  { under: 1_200_000_000, rate: 0.005, cap: null, label: '9억 ~ 12억' },
  { under: 1_500_000_000, rate: 0.006, cap: null, label: '12억 ~ 15억' },
  { under: Infinity, rate: 0.007, cap: null, label: '15억 이상' },
]

/** 주택 임대차 상한요율 */
const LEASE_BRACKETS: Bracket[] = [
  { under: 50_000_000, rate: 0.005, cap: 200_000, label: '5천만원 미만' },
  { under: 100_000_000, rate: 0.004, cap: 300_000, label: '5천만 ~ 1억' },
  { under: 600_000_000, rate: 0.003, cap: null, label: '1억 ~ 6억' },
  { under: 1_200_000_000, rate: 0.004, cap: null, label: '6억 ~ 12억' },
  { under: 1_500_000_000, rate: 0.005, cap: null, label: '12억 ~ 15억' },
  { under: Infinity, rate: 0.006, cap: null, label: '15억 이상' },
]

export interface BrokerageInput {
  dealType: DealType
  /** 매매가 (매매) 또는 보증금 (임대차) */
  price: number
  /** 월세 (임대차만). 0이면 전세 */
  monthlyRent: number
  /** 부가세 포함 여부 — 중개업자가 일반과세자면 10%가 붙는다 */
  includeVat: boolean
}

export interface BrokerageResult {
  /** 요율을 적용하는 거래금액. 월세가 있으면 환산보증금 */
  dealAmount: number
  /** 월세를 환산해 더했는지 */
  converted: boolean
  /** 환산에 쓴 배수 (100 또는 70) */
  multiplier: number
  rate: number
  bracketLabel: string
  /** 한도액이 적용됐는지 */
  capped: boolean
  cap: number | null
  /** 부가세 제외 상한 */
  fee: number
  vat: number
  /** 부가세 포함 총액 */
  total: number
}

/**
 * 월세 거래의 환산보증금.
 *
 *   환산보증금 = 보증금 + 월세 × 100
 *   단, 그 값이 5천만원 미만이면 배수를 70으로 낮춰 다시 계산한다
 *
 * 소액 월세 거래에서 보수가 과도해지지 않게 하는 장치다.
 */
export function convertedDeposit(
  deposit: number,
  monthlyRent: number,
): {
  amount: number
  multiplier: number
} {
  if (monthlyRent <= 0) return { amount: deposit, multiplier: 0 }

  const byHundred = deposit + monthlyRent * 100
  if (byHundred >= 50_000_000) return { amount: byHundred, multiplier: 100 }
  return { amount: deposit + monthlyRent * 70, multiplier: 70 }
}

function bracketFor(amount: number, dealType: DealType): Bracket {
  const brackets = dealType === 'sale' ? SALE_BRACKETS : LEASE_BRACKETS
  return brackets.find((b) => amount < b.under) ?? brackets[brackets.length - 1]!
}

export function calcBrokerageFee(input: BrokerageInput): BrokerageResult {
  const { dealType, price, monthlyRent, includeVat } = input

  const empty: BrokerageResult = {
    dealAmount: 0,
    converted: false,
    multiplier: 0,
    rate: 0,
    bracketLabel: '-',
    capped: false,
    cap: null,
    fee: 0,
    vat: 0,
    total: 0,
  }
  if (!Number.isFinite(price) || price <= 0) return empty

  // 매매는 월세 개념이 없다
  const rent = dealType === 'lease' ? Math.max(0, monthlyRent) : 0
  const { amount, multiplier } = convertedDeposit(price, rent)

  const bracket = bracketFor(amount, dealType)
  const byRate = amount * bracket.rate
  // 한도액이 있으면 요율 계산액과 비교해 작은 쪽이 상한이다
  const capped = bracket.cap !== null && byRate > bracket.cap
  const fee = won(capped ? bracket.cap! : byRate)

  const vat = includeVat ? won(fee * VAT_RATE) : 0

  return {
    dealAmount: won(amount),
    converted: multiplier > 0,
    multiplier,
    rate: bracket.rate,
    bracketLabel: bracket.label,
    capped,
    cap: bracket.cap,
    fee,
    vat,
    total: fee + vat,
  }
}

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  sale: '매매 · 교환',
  lease: '임대차 (전세 · 월세)',
}

export const BROKERAGE_DISCLAIMER =
  `주택 기준 법정 상한이며 실제 보수는 이 범위 안에서 협의로 정합니다. ` +
  `오피스텔·상가·토지는 요율이 다르고, 지자체 조례로 달라질 수 있습니다. ` +
  `부가세는 중개업자가 일반과세자인 경우에만 붙습니다. (기준 ${BROKERAGE_FEE_AS_OF})`
