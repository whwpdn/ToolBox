import { describe, expect, it } from 'vitest'
import { anniversaryDay, calcAge, nextBirthday } from './logic'

const d = (year: number, month: number, day: number) => ({ year, month, day })

describe('calcAge · 만 나이', () => {
  it('생일이 지났으면 만 나이가 올라간다', () => {
    const r = calcAge('1990-05-15', '2026-07-30')
    expect(r.manAge).toBe(36)
  })

  it('생일이 아직 안 지났으면 만 나이가 하나 적다', () => {
    const r = calcAge('1990-09-15', '2026-07-30')
    expect(r.manAge).toBe(35)
  })

  it('생일 당일에는 만 나이가 올라간다', () => {
    const r = calcAge('1990-07-30', '2026-07-30')
    expect(r.manAge).toBe(36)
    expect(r.daysToNextBirthday).toBe(0)
  })

  it('생일 하루 전에는 아직 올라가지 않는다', () => {
    const r = calcAge('1990-07-31', '2026-07-30')
    expect(r.manAge).toBe(35)
    expect(r.daysToNextBirthday).toBe(1)
  })

  it('태어난 날은 만 0세다', () => {
    const r = calcAge('2026-07-30', '2026-07-30')
    expect(r.manAge).toBe(0)
    expect(r.totalDays).toBe(0)
  })
})

describe('calcAge · 세는 나이와 연 나이', () => {
  it('세는 나이는 태어난 해를 1살로 센다', () => {
    expect(calcAge('2026-01-01', '2026-07-30').koreanAge).toBe(1)
    expect(calcAge('2026-12-31', '2026-12-31').koreanAge).toBe(1)
  })

  it('해가 바뀌면 세는 나이가 1 늘어난다', () => {
    expect(calcAge('2025-12-31', '2026-01-01').koreanAge).toBe(2)
  })

  it('연 나이는 연도 차이만 본다', () => {
    expect(calcAge('1990-12-31', '2026-01-01').yearAge).toBe(36)
    expect(calcAge('1990-01-01', '2026-12-31').yearAge).toBe(36)
  })

  it('세는 나이 = 연 나이 + 1', () => {
    const r = calcAge('1990-05-15', '2026-07-30')
    expect(r.koreanAge).toBe(r.yearAge + 1)
  })
})

describe('calcAge · 부가 정보', () => {
  it('년·월·일로 분해한다', () => {
    const r = calcAge('1990-05-15', '2026-07-30')
    expect(r.breakdown).toEqual({ years: 36, months: 2, days: 15 })
  })

  it('총 일수를 센다', () => {
    expect(calcAge('2026-07-01', '2026-07-30').totalDays).toBe(29)
  })

  it('태어난 요일을 알려준다', () => {
    // 1990-05-15는 화요일
    expect(calcAge('1990-05-15', '2026-07-30').birthWeekday).toBe('화')
  })

  it('다음 생일 라벨을 만든다', () => {
    const r = calcAge('1990-09-15', '2026-07-30')
    expect(r.nextBirthdayLabel).toContain('2026년 9월 15일')
    expect(r.daysToNextBirthday).toBe(47)
  })
})

describe('calcAge · 경계값', () => {
  it('생년월일이 미래면 isFuture 로 표시한다', () => {
    const r = calcAge('2030-01-01', '2026-07-30')
    expect(r.valid).toBe(true)
    expect(r.isFuture).toBe(true)
    expect(r.manAge).toBe(0)
  })

  it('잘못된 날짜는 valid=false', () => {
    expect(calcAge('1990-02-30', '2026-07-30').valid).toBe(false)
    expect(calcAge('', '2026-07-30').valid).toBe(false)
    expect(calcAge('1990-05-15', 'bad').valid).toBe(false)
  })
})

describe('nextBirthday', () => {
  it('올해 생일이 남았으면 올해 날짜', () => {
    expect(nextBirthday(d(1990, 12, 25), d(2026, 7, 30))).toEqual(d(2026, 12, 25))
  })

  it('올해 생일이 지났으면 내년 날짜', () => {
    expect(nextBirthday(d(1990, 1, 1), d(2026, 7, 30))).toEqual(d(2027, 1, 1))
  })

  it('오늘이 생일이면 오늘', () => {
    expect(nextBirthday(d(1990, 7, 30), d(2026, 7, 30))).toEqual(d(2026, 7, 30))
  })

  it('2월 29일생은 평년에 3월 1일로 넘긴다', () => {
    // 2026은 평년
    expect(nextBirthday(d(2000, 2, 29), d(2026, 1, 1))).toEqual(d(2026, 3, 1))
    // 2028은 윤년
    expect(nextBirthday(d(2000, 2, 29), d(2028, 1, 1))).toEqual(d(2028, 2, 29))
  })
})

describe('anniversaryDay', () => {
  it('태어난 날로부터 N일 뒤를 계산한다', () => {
    expect(anniversaryDay('2026-07-30', 100)).toContain('2026년 11월 7일')
  })

  it('0일이면 태어난 날', () => {
    expect(anniversaryDay('2026-07-30', 0)).toContain('2026년 7월 30일')
  })

  it('잘못된 날짜는 빈 문자열', () => {
    expect(anniversaryDay('bad', 100)).toBe('')
  })
})
