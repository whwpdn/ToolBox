import { describe, expect, it } from 'vitest'
import { calcDateDiff, countWeekdays, shiftDate } from './logic'

describe('calcDateDiff', () => {
  it('일수·주수를 계산한다', () => {
    const r = calcDateDiff('2026-01-01', '2026-01-31')
    expect(r.valid).toBe(true)
    expect(r.days).toBe(30)
    expect(r.weeks).toBe(4)
    expect(r.remainderDays).toBe(2)
  })

  it('시작일 포함 일수를 따로 제공한다', () => {
    const r = calcDateDiff('2026-01-01', '2026-01-31')
    expect(r.daysInclusive).toBe(31) // 1월 전체 일수
  })

  it('같은 날은 0일, 포함 계산은 1일', () => {
    const r = calcDateDiff('2026-07-30', '2026-07-30')
    expect(r.days).toBe(0)
    expect(r.daysInclusive).toBe(1)
  })

  it('종료일이 앞서면 음수로 나온다', () => {
    const r = calcDateDiff('2026-07-30', '2026-07-20')
    expect(r.days).toBe(-10)
    expect(r.daysInclusive).toBe(-11)
  })

  it('년·월·일로 분해한다', () => {
    const r = calcDateDiff('2020-03-15', '2026-07-30')
    expect(r.breakdown).toEqual({ years: 6, months: 4, days: 15 })
    expect(r.totalMonths).toBe(76)
  })

  it('윤년을 포함한 1년은 366일', () => {
    expect(calcDateDiff('2024-01-01', '2025-01-01').days).toBe(366)
  })

  it('잘못된 날짜는 valid=false 이고 값이 0이다', () => {
    const r = calcDateDiff('2026-02-30', '2026-07-30')
    expect(r.valid).toBe(false)
    expect(r.days).toBe(0)
    expect(r.startLabel).toBe('')
  })

  it('빈 입력도 안전하게 처리한다', () => {
    expect(calcDateDiff('', '').valid).toBe(false)
  })

  it('요일이 포함된 라벨을 만든다', () => {
    const r = calcDateDiff('2026-07-30', '2026-08-01')
    expect(r.startLabel).toBe('2026년 7월 30일 (목)')
    expect(r.endLabel).toBe('2026년 8월 1일 (토)')
  })
})

describe('countWeekdays', () => {
  const d = (year: number, month: number, day: number) => ({ year, month, day })

  it('한 주는 평일 5일 + 주말 2일', () => {
    // 2026-08-03(월) ~ 2026-08-09(일)
    const r = countWeekdays(d(2026, 8, 3), d(2026, 8, 9))
    expect(r.weekdayCount).toBe(5)
    expect(r.weekendCount).toBe(2)
  })

  it('양 끝을 모두 포함해서 센다', () => {
    // 토요일 하루
    const r = countWeekdays(d(2026, 8, 1), d(2026, 8, 1))
    expect(r.weekdayCount).toBe(0)
    expect(r.weekendCount).toBe(1)
  })

  it('평일 하루', () => {
    const r = countWeekdays(d(2026, 8, 3), d(2026, 8, 3))
    expect(r.weekdayCount).toBe(1)
    expect(r.weekendCount).toBe(0)
  })

  it('역순 입력도 같은 결과를 낸다', () => {
    const forward = countWeekdays(d(2026, 8, 3), d(2026, 8, 9))
    const backward = countWeekdays(d(2026, 8, 9), d(2026, 8, 3))
    expect(backward).toEqual(forward)
  })

  it('합계가 전체 일수와 같다', () => {
    const r = countWeekdays(d(2026, 1, 1), d(2026, 12, 31))
    expect(r.weekdayCount + r.weekendCount).toBe(365)
  })

  it('2026년의 주말은 104일이다', () => {
    // 2026-01-01(목) ~ 2026-12-31(목): 52주 + 1일, 주말은 52×2 = 104일
    const r = countWeekdays(d(2026, 1, 1), d(2026, 12, 31))
    expect(r.weekendCount).toBe(104)
    expect(r.weekdayCount).toBe(261)
  })
})

describe('shiftDate', () => {
  it('N일 뒤 날짜', () => {
    const r = shiftDate('2026-07-30', 100)
    expect(r.valid).toBe(true)
    expect(r.iso).toBe('2026-11-07')
  })

  it('N일 전 날짜', () => {
    expect(shiftDate('2026-01-01', -1).iso).toBe('2025-12-31')
  })

  it('0일이면 그대로', () => {
    expect(shiftDate('2026-07-30', 0).iso).toBe('2026-07-30')
  })

  it('윤년을 넘어간다', () => {
    expect(shiftDate('2024-02-28', 2).iso).toBe('2024-03-01')
  })

  it('잘못된 기준일은 valid=false', () => {
    const r = shiftDate('2026-13-01', 10)
    expect(r.valid).toBe(false)
    expect(r.iso).toBe('')
  })
})
