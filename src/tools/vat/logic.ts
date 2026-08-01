import { won } from '@/utils/money'
import { VAT_RATE } from '@/core/finance-policy'

/**
 * 입력한 금액이 무엇인지에 따라 계산이 완전히 달라진다.
 * '10만원'이 공급가인지 부가세 포함가인지 헷갈려서 생기는 실수가 가장 잦다.
 */
export type VatBase = 'supply' | 'total'

export interface VatResult {
  /** 공급가액 (부가세 제외) */
  supply: number
  /** 부가세 */
  vat: number
  /** 합계 금액 (부가세 포함) */
  total: number
}

/**
 * 부가가치세 계산.
 *
 * - 공급가 기준: 부가세 = 공급가 × 10%
 * - 합계 기준(역산): 공급가 = 합계 ÷ 1.1, 부가세 = 합계 − 공급가
 *
 * 역산에서 `합계 × 10%` 로 계산하면 안 된다. 11만원의 부가세는 1.1만원이 아니라 1만원이다.
 */
export function calcVat(amount: number, base: VatBase, rate: number = VAT_RATE): VatResult {
  if (!Number.isFinite(amount) || amount <= 0) return { supply: 0, vat: 0, total: 0 }

  if (base === 'supply') {
    const supply = won(amount)
    const vat = won(amount * rate)
    return { supply, vat, total: supply + vat }
  }

  const total = won(amount)
  const supply = won(amount / (1 + rate))
  // 반올림 오차가 합계에 남지 않도록 부가세를 차액으로 확정한다
  return { supply, vat: total - supply, total }
}

export const BASE_LABELS: Record<VatBase, string> = {
  supply: '공급가액 (부가세 제외)',
  total: '합계 금액 (부가세 포함)',
}
