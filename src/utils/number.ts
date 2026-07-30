/** 유한한 숫자인지 확인. NaN/Infinity를 화면에 노출하지 않기 위한 게이트 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * 지정한 소수점 자리로 반올림한다.
 * 부동소수 표현 오차(예: 1.005 → 1.00) 때문에 지수 표기를 경유한다.
 */
export function round(value: number, digits = 0): number {
  if (!isFiniteNumber(value)) return 0
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON * Math.sign(value)) * factor) / factor
}

/** 천단위 구분자를 넣어 표시한다. 유한하지 않은 값은 '-' */
export function formatNumber(value: number, digits = 0): string {
  if (!isFiniteNumber(value)) return '-'
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** 유의미한 자리까지만 표시한다(단위 변환처럼 자릿수가 크게 변하는 값에 사용) */
export function formatSignificant(value: number, maxDigits = 6): string {
  if (!isFiniteNumber(value)) return '-'
  if (value === 0) return '0'

  const abs = Math.abs(value)
  // 지나치게 크거나 작은 값은 지수 표기가 더 읽기 쉽다
  if (abs >= 1e15 || abs < 1e-9) return value.toExponential(4)

  const decimals =
    abs >= 1 ? Math.max(0, maxDigits - Math.floor(Math.log10(abs)) - 1) : maxDigits + 2
  const rounded = round(value, Math.min(decimals, 12))
  return rounded.toLocaleString('ko-KR', { maximumFractionDigits: Math.min(decimals, 12) })
}

/** 백분율 표시 (0.0455 → '4.55%') */
export function formatPercent(ratio: number, digits = 2): string {
  if (!isFiniteNumber(ratio)) return '-'
  return `${formatNumber(ratio * 100, digits)}%`
}

/** 입력값을 안전한 숫자로 좁힌다. 파싱 실패 시 fallback */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return isFiniteNumber(value) ? value : fallback
  if (typeof value !== 'string') return fallback
  const cleaned = value.replace(/[,\s]/g, '')
  if (cleaned === '' || cleaned === '-') return fallback
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : fallback
}

/** 값을 [min, max] 범위로 자른다 */
export function clamp(value: number, min: number, max: number): number {
  if (!isFiniteNumber(value)) return min
  return Math.min(Math.max(value, min), max)
}
