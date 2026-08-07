import { won } from '@/utils/money'
import { ACQUISITION_TAX_AS_OF } from '@/core/finance-policy'

/**
 * 주택 취득세 계산.
 *
 * 취득세는 본세 하나가 아니라 세 가지가 함께 붙는다.
 *   취득세 본세 + 지방교육세 + 농어촌특별세
 * 이 중 농특세는 전용면적 85㎡ 이하 국민주택이면 면제된다.
 *
 * 세율은 주택 수와 조정대상지역 여부에 따라 크게 달라지므로 정책 상수로 분리했다.
 * 실제 신고 세액은 지자체 확인이 필요한 참고 계산이다.
 */

export type HouseCount = 'first' | 'second' | 'thirdPlus'

export interface AcquisitionInput {
  /** 취득가액 (원) */
  price: number
  /** 전용면적 (㎡). 85 이하면 농특세 면제 */
  areaM2: number
  houseCount: HouseCount
  /** 조정대상지역 여부 — 2주택 이상에서 중과 여부가 갈린다 */
  regulated: boolean
}

export interface AcquisitionResult {
  /** 취득세 본세율 (0.01 = 1%) */
  baseRate: number
  baseTax: number
  /** 지방교육세 */
  eduTax: number
  /** 농어촌특별세 (85㎡ 이하 면제) */
  ruralTax: number
  total: number
  /** 취득가 대비 총 부담률 */
  effectiveRate: number
  /** 농특세가 면제됐는지 */
  ruralExempt: boolean
  /** 중과세율이 적용됐는지 */
  heavy: boolean
}

/** 농어촌특별세가 면제되는 국민주택 규모 (전용면적) */
export const RURAL_TAX_EXEMPT_AREA = 85

/**
 * 1주택(또는 비조정지역 2주택)의 기본 세율.
 *
 * - 6억 이하: 1%
 * - 6억 초과 9억 이하: 6억에서 9억으로 갈수록 1% → 3% 로 선형 증가
 *   `(취득가 × 2/3억 − 3) ÷ 100`, 소수점 다섯째 자리에서 반올림
 * - 9억 초과: 3%
 */
export function baseRateFor(price: number): number {
  const eok = price / 100_000_000
  if (eok <= 6) return 0.01
  if (eok > 9) return 0.03
  // 지방세법의 계산식을 그대로 따른다 (소수점 5자리 반올림)
  const rate = (eok * (2 / 3) - 3) / 100
  return Math.round(rate * 1e5) / 1e5
}

/**
 * 지방교육세율.
 * 기본 세율 구간에서는 본세율의 1/10 (단, 6억 이하 1% 구간은 0.1%),
 * 중과 구간(8%·12%)에서는 0.4% 로 고정된다.
 */
function eduRateFor(baseRate: number, heavy: boolean): number {
  if (heavy) return 0.004
  return baseRate / 10
}

/** 농어촌특별세율. 기본 구간 0.2%, 중과 구간 0.6% / 1.0% */
function ruralRateFor(baseRate: number, heavy: boolean): number {
  if (!heavy) return 0.002
  return baseRate === 0.08 ? 0.006 : 0.01
}

/** 주택 수·지역에 따른 중과세율. 해당 없으면 null */
function heavyRateFor(houseCount: HouseCount, regulated: boolean): number | null {
  if (houseCount === 'first') return null
  if (houseCount === 'second') return regulated ? 0.08 : null
  // 3주택 이상
  return regulated ? 0.12 : 0.08
}

export function calcAcquisitionTax(input: AcquisitionInput): AcquisitionResult {
  const { price, areaM2, houseCount, regulated } = input

  const empty: AcquisitionResult = {
    baseRate: 0,
    baseTax: 0,
    eduTax: 0,
    ruralTax: 0,
    total: 0,
    effectiveRate: 0,
    ruralExempt: false,
    heavy: false,
  }
  if (!Number.isFinite(price) || price <= 0) return empty

  const heavyRate = heavyRateFor(houseCount, regulated)
  const heavy = heavyRate !== null
  const baseRate = heavyRate ?? baseRateFor(price)

  const ruralExempt = areaM2 > 0 && areaM2 <= RURAL_TAX_EXEMPT_AREA

  const baseTax = won(price * baseRate)
  const eduTax = won(price * eduRateFor(baseRate, heavy))
  const ruralTax = ruralExempt ? 0 : won(price * ruralRateFor(baseRate, heavy))
  const total = baseTax + eduTax + ruralTax

  return {
    baseRate,
    baseTax,
    eduTax,
    ruralTax,
    total,
    effectiveRate: total / price,
    ruralExempt,
    heavy,
  }
}

export const HOUSE_COUNT_LABELS: Record<HouseCount, string> = {
  first: '1주택 (무주택자 취득 포함)',
  second: '2주택',
  thirdPlus: '3주택 이상',
}

export const ACQUISITION_DISCLAIMER =
  `주택 유상취득 기준 참고 계산입니다. 상속·증여·신축, 오피스텔·토지 등은 세율이 다르고 ` +
  `생애최초 감면, 일시적 2주택 등 특례는 반영하지 않았습니다. ` +
  `실제 신고 세액은 관할 지자체나 세무 전문가에게 확인하세요. (기준 ${ACQUISITION_TAX_AS_OF})`
