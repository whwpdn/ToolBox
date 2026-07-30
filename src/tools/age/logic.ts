import {
  addDays,
  daysBetween,
  diffYMD,
  formatKorean,
  parseISODate,
  toUTC,
  weekdayName,
  type DateParts,
  type YMD,
} from '@/utils/date'

export interface AgeResult {
  valid: boolean
  /** 만 나이 (생일이 지났는지 반영) */
  manAge: number
  /** 세는 나이 (한국식: 태어나면 1살, 해가 바뀌면 +1) */
  koreanAge: number
  /** 연 나이 (현재 연도 − 출생 연도). 병역·청소년보호법 등에서 사용 */
  yearAge: number
  breakdown: YMD
  totalDays: number
  /** 다음 생일까지 남은 일수. 오늘이 생일이면 0 */
  daysToNextBirthday: number
  nextBirthdayLabel: string
  birthWeekday: string
  /** 태어난 날이 미래면 true */
  isFuture: boolean
}

const EMPTY: AgeResult = {
  valid: false,
  manAge: 0,
  koreanAge: 0,
  yearAge: 0,
  breakdown: { years: 0, months: 0, days: 0 },
  totalDays: 0,
  daysToNextBirthday: 0,
  nextBirthdayLabel: '',
  birthWeekday: '',
  isFuture: false,
}

/**
 * 다음 생일을 구한다.
 * 2월 29일생은 평년에 3월 1일로 넘긴다(법정 기준일 관행).
 */
export function nextBirthday(birth: DateParts, base: DateParts): DateParts {
  const candidateThisYear = normalizeBirthday(birth, base.year)
  if (toUTC(candidateThisYear) >= toUTC(base)) return candidateThisYear
  return normalizeBirthday(birth, base.year + 1)
}

function normalizeBirthday(birth: DateParts, year: number): DateParts {
  if (birth.month === 2 && birth.day === 29) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    return isLeap ? { year, month: 2, day: 29 } : { year, month: 3, day: 1 }
  }
  return { year, month: birth.month, day: birth.day }
}

export function calcAge(birthText: string, baseText: string): AgeResult {
  const birth = parseISODate(birthText)
  const base = parseISODate(baseText)
  if (!birth || !base) return EMPTY

  if (toUTC(birth) > toUTC(base)) {
    return { ...EMPTY, valid: true, isFuture: true, birthWeekday: weekdayName(birth) }
  }

  const breakdown = diffYMD(birth, base)
  const next = nextBirthday(birth, base)

  return {
    valid: true,
    manAge: breakdown.years,
    // 세는 나이: 태어난 해를 1살로 시작해 해가 바뀔 때마다 1살 추가
    koreanAge: base.year - birth.year + 1,
    yearAge: base.year - birth.year,
    breakdown,
    totalDays: daysBetween(birth, base),
    daysToNextBirthday: daysBetween(base, next),
    nextBirthdayLabel: formatKorean(next),
    birthWeekday: weekdayName(birth),
    isFuture: false,
  }
}

/** N번째 기념일(태어난 날로부터 N일) */
export function anniversaryDay(birthText: string, days: number): string {
  const birth = parseISODate(birthText)
  if (!birth) return ''
  return formatKorean(addDays(birth, days))
}
