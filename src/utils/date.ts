/**
 * 날짜 계산 유틸.
 *
 * 날짜 차이 계산은 서머타임·시간대 때문에 어긋나기 쉬우므로,
 * 모든 계산을 'UTC 자정 기준 시각'으로 정규화한 뒤 수행한다.
 * (한국은 DST가 없지만, 브라우저 시간대는 사용자가 바꿀 수 있다)
 */

export interface DateParts {
  year: number
  month: number // 1~12
  day: number // 1~31
}

export const MS_PER_DAY = 86_400_000

/** 'YYYY-MM-DD' 파싱. 형식이나 실제 존재 여부가 틀리면 null */
export function parseISODate(text: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (month < 1 || month > 12) return null
  if (day < 1 || day > daysInMonth(year, month)) return null

  return { year, month, day }
}

export function toISODate(parts: DateParts): string {
  const mm = String(parts.month).padStart(2, '0')
  const dd = String(parts.day).padStart(2, '0')
  return `${parts.year}-${mm}-${dd}`
}

/** 시간대 영향 없이 비교·연산하기 위한 UTC 타임스탬프 */
export function toUTC(parts: DateParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day)
}

export function fromUTC(timestamp: number): DateParts {
  const d = new Date(timestamp)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

/** b − a (일 단위). a가 더 늦으면 음수 */
export function daysBetween(a: DateParts, b: DateParts): number {
  return Math.round((toUTC(b) - toUTC(a)) / MS_PER_DAY)
}

export function addDays(parts: DateParts, days: number): DateParts {
  return fromUTC(toUTC(parts) + days * MS_PER_DAY)
}

/**
 * 개월 수를 더한다. 말일 처리에 주의.
 * 1월 31일 + 1개월 = 2월 28일(윤년이면 29일)로 보정한다.
 */
export function addMonths(parts: DateParts, months: number): DateParts {
  const total = parts.year * 12 + (parts.month - 1) + months
  const year = Math.floor(total / 12)
  const month = (total % 12) + 1
  const day = Math.min(parts.day, daysInMonth(year, month))
  return { year, month, day }
}

export interface YMD {
  years: number
  months: number
  days: number
}

/** -0이 결과로 새는 것을 막는다 (화면에 '-0'으로 표시되는 것을 방지) */
function negate(n: number): number {
  return n === 0 ? 0 : -n
}

/**
 * 두 날짜의 차이를 년/월/일로 분해한다.
 *
 * '자릿수 빌려오기' 방식은 '2024-01-31 → 2024-03-01' 처럼 일수 차이가 한 달 길이를
 * 넘는 경우 한 번 빌려도 음수가 남아 어긋난다.
 * 그래서 from에 개월을 더해가며 to를 넘지 않는 최대 개월 수를 찾고, 남은 차이를
 * 일수로 세는 방식을 쓴다. addMonths의 말일 보정과 일관된 결과가 나온다.
 */
export function diffYMD(from: DateParts, to: DateParts): YMD {
  if (toUTC(from) > toUTC(to)) {
    const flipped = diffYMD(to, from)
    return {
      years: negate(flipped.years),
      months: negate(flipped.months),
      days: negate(flipped.days),
    }
  }

  // 월 단위 추정값은 최대 1개월 넘칠 수 있으므로 넘지 않을 때까지 줄인다
  let totalMonths = (to.year - from.year) * 12 + (to.month - from.month)
  while (totalMonths > 0 && toUTC(addMonths(from, totalMonths)) > toUTC(to)) {
    totalMonths -= 1
  }

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days: daysBetween(addMonths(from, totalMonths), to),
  }
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 요일 (0=일요일) */
export function weekdayIndex(parts: DateParts): number {
  return new Date(toUTC(parts)).getUTCDay()
}

export function weekdayName(parts: DateParts): string {
  return WEEKDAYS[weekdayIndex(parts)] ?? ''
}

export function isWeekend(parts: DateParts): boolean {
  const d = weekdayIndex(parts)
  return d === 0 || d === 6
}

/** 시스템 시간대 기준 오늘 */
export function today(): DateParts {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
}

export function formatKorean(parts: DateParts): string {
  return `${parts.year}년 ${parts.month}월 ${parts.day}일 (${weekdayName(parts)})`
}
