import type { UnitDef } from '@/core/units'

/**
 * 온도는 원점이 서로 다르므로(0℃ ≠ 0℉ ≠ 0K) 배율 테이블로 변환할 수 없다.
 * factor는 UnitDef 형태를 맞추기 위한 자리만 채우고, 실제 변환은 아래 함수가 담당한다.
 */
export const TEMPERATURE_UNITS: UnitDef[] = [
  { code: 'c', label: '섭씨 (℃)', factor: 1 },
  { code: 'f', label: '화씨 (℉)', factor: 1 },
  { code: 'k', label: '켈빈 (K)', factor: 1 },
  { code: 'r', label: '랭킨 (°R)', factor: 1 },
]

/** 절대영도 (섭씨) */
export const ABSOLUTE_ZERO_C = -273.15

/** 어떤 단위든 일단 섭씨로 모은 뒤 목표 단위로 내보낸다 */
function toCelsius(value: number, from: string): number {
  switch (from) {
    case 'c':
      return value
    case 'f':
      return ((value - 32) * 5) / 9
    case 'k':
      return value + ABSOLUTE_ZERO_C
    case 'r':
      return ((value - 491.67) * 5) / 9
    default:
      return NaN
  }
}

function fromCelsius(celsius: number, to: string): number {
  switch (to) {
    case 'c':
      return celsius
    case 'f':
      return (celsius * 9) / 5 + 32
    case 'k':
      return celsius - ABSOLUTE_ZERO_C
    case 'r':
      return ((celsius - ABSOLUTE_ZERO_C) * 9) / 5
    default:
      return NaN
  }
}

export function convertTemperature(value: number, from: string, to: string): number {
  if (!Number.isFinite(value)) return 0
  const celsius = toCelsius(value, from)
  if (!Number.isFinite(celsius)) return 0
  const result = fromCelsius(celsius, to)
  return Number.isFinite(result) ? result : 0
}

/** 절대영도보다 낮은 온도인지 (물리적으로 불가능한 입력 안내용) */
export function isBelowAbsoluteZero(value: number, unit: string): boolean {
  const celsius = toCelsius(value, unit)
  if (!Number.isFinite(celsius)) return false
  // 부동소수 오차로 -273.15가 미세하게 작게 나오는 경우를 허용한다
  return celsius < ABSOLUTE_ZERO_C - 1e-9
}
