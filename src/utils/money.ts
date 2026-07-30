import { formatNumber, isFiniteNumber } from './number'

/**
 * 화폐 금액은 항상 '원 단위 정수'로 다룬다.
 * 0.1 + 0.2 !== 0.3 문제로 상환 스케줄 합계가 1원씩 어긋나면 도구 신뢰가 무너지므로,
 * 중간 계산은 number로 하되 각 회차 결과는 이 함수로 원 단위를 확정한다.
 */
export function won(value: number): number {
  if (!isFiniteNumber(value)) return 0
  return Math.round(value)
}

/** 원 단위 정수 배열의 합. 부동소수 누적 오차가 없다 */
export function sumWon(values: number[]): number {
  return values.reduce((acc, v) => acc + won(v), 0)
}

/** '1,234,567원' */
export function formatWon(value: number): string {
  if (!isFiniteNumber(value)) return '-'
  return `${formatNumber(won(value))}원`
}

/**
 * 큰 금액을 한국식 단위로 읽어준다. 입력 검증용 보조 표시.
 * 123456789 → '1억 2,345만 6,789'
 */
export function formatWonKorean(value: number): string {
  const n = won(value)
  if (!isFiniteNumber(n) || n === 0) return '0'

  const sign = n < 0 ? '-' : ''
  let rest = Math.abs(n)
  const units: Array<{ size: number; label: string }> = [
    { size: 1_0000_0000_0000, label: '조' },
    { size: 1_0000_0000, label: '억' },
    { size: 1_0000, label: '만' },
  ]

  const parts: string[] = []
  for (const { size, label } of units) {
    const q = Math.floor(rest / size)
    if (q > 0) {
      parts.push(`${formatNumber(q)}${label}`)
      rest -= q * size
    }
  }
  if (rest > 0) parts.push(formatNumber(rest))

  return sign + parts.join(' ')
}

/** 연이율(%) → 월이율(소수). 4.5 → 0.00375 */
export function monthlyRate(annualRatePct: number): number {
  if (!isFiniteNumber(annualRatePct)) return 0
  return annualRatePct / 100 / 12
}
