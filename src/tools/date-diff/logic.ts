import {
  addDays,
  daysBetween,
  diffYMD,
  formatKorean,
  isWeekend,
  parseISODate,
  toISODate,
  type DateParts,
  type YMD,
} from '@/utils/date'

export interface DateDiffResult {
  valid: boolean
  /** 두 날짜 사이의 일수 (끝날 − 시작날) */
  days: number
  /** 시작일과 종료일을 모두 세는 방식 (행사 기간 등에 쓰임) */
  daysInclusive: number
  weeks: number
  /** 남은 일수 (주 단위로 나눈 뒤의 잔여) */
  remainderDays: number
  totalMonths: number
  breakdown: YMD
  /** 주말을 제외한 일수 */
  weekdayCount: number
  weekendCount: number
  startLabel: string
  endLabel: string
}

export function calcDateDiff(startText: string, endText: string): DateDiffResult {
  const start = parseISODate(startText)
  const end = parseISODate(endText)

  const empty: DateDiffResult = {
    valid: false,
    days: 0,
    daysInclusive: 0,
    weeks: 0,
    remainderDays: 0,
    totalMonths: 0,
    breakdown: { years: 0, months: 0, days: 0 },
    weekdayCount: 0,
    weekendCount: 0,
    startLabel: '',
    endLabel: '',
  }

  if (!start || !end) return empty

  const days = daysBetween(start, end)
  const breakdown = diffYMD(start, end)
  const { weekdayCount, weekendCount } = countWeekdays(start, end)

  return {
    valid: true,
    days,
    daysInclusive: days >= 0 ? days + 1 : days - 1,
    weeks: Math.trunc(days / 7),
    remainderDays: days % 7,
    totalMonths: breakdown.years * 12 + breakdown.months,
    breakdown,
    weekdayCount,
    weekendCount,
    startLabel: formatKorean(start),
    endLabel: formatKorean(end),
  }
}

/**
 * 구간의 평일·주말 수를 센다 (양 끝 포함).
 * 공휴일은 매년 바뀌고 대체공휴일 규칙도 있어서 여기서는 다루지 않는다.
 */
export function countWeekdays(
  start: DateParts,
  end: DateParts,
): { weekdayCount: number; weekendCount: number } {
  const total = Math.abs(daysBetween(start, end))
  const from = daysBetween(start, end) >= 0 ? start : end

  let weekdayCount = 0
  let weekendCount = 0

  for (let i = 0; i <= total; i += 1) {
    if (isWeekend(addDays(from, i))) weekendCount += 1
    else weekdayCount += 1
  }

  return { weekdayCount, weekendCount }
}

export interface ShiftResult {
  valid: boolean
  iso: string
  label: string
}

/** 기준일에서 N일 뒤/전 날짜 */
export function shiftDate(baseText: string, offsetDays: number): ShiftResult {
  const base = parseISODate(baseText)
  if (!base) return { valid: false, iso: '', label: '' }

  const shifted = addDays(base, offsetDays)
  return { valid: true, iso: toISODate(shifted), label: formatKorean(shifted) }
}
