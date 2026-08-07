/**
 * 시분초 계산기.
 *
 * 시간은 60진법이라 계산기로 더하면 틀린다(1시간 30분 + 45분 = 1.75 + 0.75 ≠ 2시간 15분).
 * 모든 값을 '초'로 환산해 계산한 뒤 다시 시·분·초로 풀어낸다.
 */

export interface HMS {
  hours: number
  minutes: number
  seconds: number
}

export type TimeOp = 'add' | 'subtract'

export const SECONDS_PER_MINUTE = 60
export const SECONDS_PER_HOUR = 3600

/** 시·분·초를 초로 환산. 분·초가 60을 넘어도 그대로 더한다(90분 = 1시간 30분) */
export function toSeconds(value: HMS): number {
  const { hours, minutes, seconds } = value
  if (![hours, minutes, seconds].every(Number.isFinite)) return 0
  return hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE + seconds
}

/**
 * 초를 시·분·초로 푼다.
 * 음수는 부호를 분리해 각 항이 음수로 흩어지지 않게 한다 (-90초 → -(1분 30초)).
 */
export function fromSeconds(total: number): HMS & { negative: boolean } {
  if (!Number.isFinite(total)) return { hours: 0, minutes: 0, seconds: 0, negative: false }

  const negative = total < 0
  const abs = Math.abs(Math.round(total))

  return {
    hours: Math.floor(abs / SECONDS_PER_HOUR),
    minutes: Math.floor((abs % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: abs % SECONDS_PER_MINUTE,
    negative,
  }
}

export interface TimeCalcResult {
  totalSeconds: number
  hours: number
  minutes: number
  seconds: number
  negative: boolean
  /** '1시간 30분 20초' */
  label: string
  /** '01:30:20' */
  clock: string
  /** 소수 시간 (1.5시간) — 급여·공수 계산에 쓰인다 */
  decimalHours: number
  decimalMinutes: number
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function describe(totalSeconds: number): TimeCalcResult {
  const { hours, minutes, seconds, negative } = fromSeconds(totalSeconds)
  const sign = negative ? '-' : ''

  const parts = [
    hours > 0 ? `${hours}시간` : '',
    minutes > 0 ? `${minutes}분` : '',
    seconds > 0 || (hours === 0 && minutes === 0) ? `${seconds}초` : '',
  ].filter(Boolean)

  const rounded = Math.round(totalSeconds)

  return {
    totalSeconds: rounded,
    hours,
    minutes,
    seconds,
    negative,
    label: sign + parts.join(' '),
    clock: `${sign}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    decimalHours: rounded / SECONDS_PER_HOUR,
    decimalMinutes: rounded / SECONDS_PER_MINUTE,
  }
}

/** 두 시간을 더하거나 뺀다 */
export function calcTime(a: HMS, b: HMS, op: TimeOp): TimeCalcResult {
  const total = op === 'add' ? toSeconds(a) + toSeconds(b) : toSeconds(a) - toSeconds(b)
  return describe(total)
}

/** 여러 시간의 합계 (근무시간 합산 등) */
export function sumTimes(values: HMS[]): TimeCalcResult {
  return describe(values.reduce((acc, v) => acc + toSeconds(v), 0))
}
