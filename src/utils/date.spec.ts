import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  daysBetween,
  daysInMonth,
  diffYMD,
  isLeapYear,
  isWeekend,
  parseISODate,
  toISODate,
  weekdayName,
} from './date'

const d = (year: number, month: number, day: number) => ({ year, month, day })

describe('parseISODate', () => {
  it('올바른 형식을 파싱한다', () => {
    expect(parseISODate('2026-07-30')).toEqual(d(2026, 7, 30))
  })

  it('형식이 틀리면 null', () => {
    expect(parseISODate('2026/07/30')).toBeNull()
    expect(parseISODate('26-7-3')).toBeNull()
    expect(parseISODate('')).toBeNull()
    expect(parseISODate('abcd-ef-gh')).toBeNull()
  })

  it('존재하지 않는 날짜는 null', () => {
    expect(parseISODate('2026-02-30')).toBeNull()
    expect(parseISODate('2026-13-01')).toBeNull()
    expect(parseISODate('2026-04-31')).toBeNull()
    expect(parseISODate('2026-00-10')).toBeNull()
  })

  it('윤년 2월 29일은 해당 연도에서만 유효하다', () => {
    expect(parseISODate('2024-02-29')).toEqual(d(2024, 2, 29))
    expect(parseISODate('2025-02-29')).toBeNull()
  })
})

describe('toISODate', () => {
  it('한 자리 월·일을 0으로 채운다', () => {
    expect(toISODate(d(2026, 7, 5))).toBe('2026-07-05')
    expect(toISODate(d(2026, 12, 31))).toBe('2026-12-31')
  })
})

describe('isLeapYear / daysInMonth', () => {
  it('4년마다 윤년, 100년은 예외, 400년은 다시 윤년', () => {
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2025)).toBe(false)
    expect(isLeapYear(1900)).toBe(false)
    expect(isLeapYear(2000)).toBe(true)
  })

  it('월별 일수', () => {
    expect(daysInMonth(2025, 1)).toBe(31)
    expect(daysInMonth(2025, 2)).toBe(28)
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2025, 4)).toBe(30)
  })
})

describe('daysBetween', () => {
  it('같은 날은 0일', () => {
    expect(daysBetween(d(2026, 7, 30), d(2026, 7, 30))).toBe(0)
  })

  it('하루 차이', () => {
    expect(daysBetween(d(2026, 7, 30), d(2026, 7, 31))).toBe(1)
  })

  it('역순이면 음수', () => {
    expect(daysBetween(d(2026, 7, 31), d(2026, 7, 30))).toBe(-1)
  })

  it('월·연 경계를 넘는다', () => {
    expect(daysBetween(d(2025, 12, 31), d(2026, 1, 1))).toBe(1)
    expect(daysBetween(d(2026, 1, 1), d(2027, 1, 1))).toBe(365)
  })

  it('윤년을 포함하면 366일', () => {
    expect(daysBetween(d(2024, 1, 1), d(2025, 1, 1))).toBe(366)
  })

  it('2월 말 경계', () => {
    expect(daysBetween(d(2024, 2, 28), d(2024, 3, 1))).toBe(2) // 윤년: 29일 존재
    expect(daysBetween(d(2025, 2, 28), d(2025, 3, 1))).toBe(1)
  })
})

describe('addDays', () => {
  it('일수를 더한다', () => {
    expect(addDays(d(2026, 7, 30), 3)).toEqual(d(2026, 8, 2))
    expect(addDays(d(2026, 1, 1), -1)).toEqual(d(2025, 12, 31))
  })

  it('윤년 2월을 건너뛴다', () => {
    expect(addDays(d(2024, 2, 28), 1)).toEqual(d(2024, 2, 29))
    expect(addDays(d(2025, 2, 28), 1)).toEqual(d(2025, 3, 1))
  })

  it('0을 더하면 그대로', () => {
    expect(addDays(d(2026, 7, 30), 0)).toEqual(d(2026, 7, 30))
  })
})

describe('addMonths', () => {
  it('개월을 더한다', () => {
    expect(addMonths(d(2026, 1, 15), 2)).toEqual(d(2026, 3, 15))
    expect(addMonths(d(2026, 12, 1), 1)).toEqual(d(2027, 1, 1))
    expect(addMonths(d(2026, 1, 1), -1)).toEqual(d(2025, 12, 1))
  })

  it('말일은 대상 월의 마지막 날로 보정한다', () => {
    expect(addMonths(d(2026, 1, 31), 1)).toEqual(d(2026, 2, 28))
    expect(addMonths(d(2024, 1, 31), 1)).toEqual(d(2024, 2, 29))
    expect(addMonths(d(2026, 3, 31), 1)).toEqual(d(2026, 4, 30))
  })

  it('12개월을 더하면 같은 월의 다음 해', () => {
    expect(addMonths(d(2026, 7, 30), 12)).toEqual(d(2027, 7, 30))
  })
})

describe('diffYMD', () => {
  it('정확히 1년', () => {
    expect(diffYMD(d(2025, 7, 30), d(2026, 7, 30))).toEqual({ years: 1, months: 0, days: 0 })
  })

  it('년·월·일 분해', () => {
    expect(diffYMD(d(2020, 3, 15), d(2026, 7, 30))).toEqual({ years: 6, months: 4, days: 15 })
  })

  it('일수가 음수면 직전 달에서 빌려온다', () => {
    // 1월 31일 → 3월 1일: 1개월 1일 (2월이 29일인 윤년)
    expect(diffYMD(d(2024, 1, 31), d(2024, 3, 1))).toEqual({ years: 0, months: 1, days: 1 })
  })

  it('월이 음수면 연도에서 빌려온다', () => {
    expect(diffYMD(d(2025, 11, 1), d(2026, 2, 1))).toEqual({ years: 0, months: 3, days: 0 })
    expect(diffYMD(d(2025, 12, 15), d(2026, 3, 10))).toEqual({ years: 0, months: 2, days: 23 })
  })

  it('같은 날은 모두 0', () => {
    expect(diffYMD(d(2026, 7, 30), d(2026, 7, 30))).toEqual({ years: 0, months: 0, days: 0 })
  })

  it('역순이면 부호가 뒤집힌다', () => {
    expect(diffYMD(d(2026, 7, 30), d(2025, 7, 30))).toEqual({ years: -1, months: 0, days: 0 })
    expect(diffYMD(d(2026, 7, 30), d(2020, 3, 15))).toEqual({ years: -6, months: -4, days: -15 })
  })

  it('결과에 -0을 흘리지 않는다', () => {
    const r = diffYMD(d(2026, 7, 30), d(2025, 7, 30))
    expect(Object.is(r.months, -0)).toBe(false)
    expect(Object.is(r.days, -0)).toBe(false)
  })

  it('한 달 길이를 넘는 일수 차이도 정확히 분해한다', () => {
    // 자릿수를 한 번만 빌리는 구현에서는 days가 음수로 남는 케이스
    expect(diffYMD(d(2024, 1, 31), d(2024, 4, 1))).toEqual({ years: 0, months: 2, days: 1 })
    expect(diffYMD(d(2025, 1, 30), d(2025, 3, 1))).toEqual({ years: 0, months: 1, days: 1 })
  })
})

describe('weekdayName / isWeekend', () => {
  it('요일을 계산한다', () => {
    // 2026-07-30은 목요일
    expect(weekdayName(d(2026, 7, 30))).toBe('목')
    // 2026-01-01은 목요일
    expect(weekdayName(d(2026, 1, 1))).toBe('목')
    // 2000-01-01은 토요일
    expect(weekdayName(d(2000, 1, 1))).toBe('토')
  })

  it('주말을 판별한다', () => {
    expect(isWeekend(d(2026, 8, 1))).toBe(true) // 토
    expect(isWeekend(d(2026, 8, 2))).toBe(true) // 일
    expect(isWeekend(d(2026, 8, 3))).toBe(false) // 월
  })
})
