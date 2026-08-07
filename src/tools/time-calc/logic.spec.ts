import { describe as group, expect, it } from 'vitest'
import { calcTime, describe, fromSeconds, sumTimes, toSeconds, type HMS } from './logic'

const hms = (hours: number, minutes: number, seconds: number): HMS => ({ hours, minutes, seconds })

group('toSeconds', () => {
  it('시·분·초를 초로 환산한다', () => {
    expect(toSeconds(hms(1, 30, 20))).toBe(5420)
    expect(toSeconds(hms(0, 0, 0))).toBe(0)
    expect(toSeconds(hms(2, 0, 0))).toBe(7200)
  })

  it('60을 넘는 분·초도 그대로 받는다 (90분 = 1시간 30분)', () => {
    expect(toSeconds(hms(0, 90, 0))).toBe(5400)
    expect(toSeconds(hms(0, 0, 120))).toBe(120)
  })

  it('유한하지 않은 값은 0', () => {
    expect(toSeconds(hms(NaN, 0, 0))).toBe(0)
  })
})

group('fromSeconds', () => {
  it('초를 시·분·초로 푼다', () => {
    expect(fromSeconds(5420)).toEqual({ hours: 1, minutes: 30, seconds: 20, negative: false })
    expect(fromSeconds(59)).toEqual({ hours: 0, minutes: 0, seconds: 59, negative: false })
    expect(fromSeconds(3600)).toEqual({ hours: 1, minutes: 0, seconds: 0, negative: false })
  })

  it('음수는 부호를 분리해 각 항을 양수로 유지한다', () => {
    expect(fromSeconds(-90)).toEqual({ hours: 0, minutes: 1, seconds: 30, negative: true })
  })

  it('toSeconds 의 역함수다', () => {
    for (const s of [0, 1, 59, 60, 3599, 3600, 86399, 123456]) {
      const parts = fromSeconds(s)
      expect(toSeconds(parts)).toBe(s)
    }
  })
})

group('describe · 표시 형식', () => {
  it('사람이 읽는 라벨', () => {
    expect(describe(5420).label).toBe('1시간 30분 20초')
    expect(describe(3600).label).toBe('1시간')
    expect(describe(90).label).toBe('1분 30초')
    expect(describe(0).label).toBe('0초')
  })

  it('시계 형식은 두 자리로 채운다', () => {
    expect(describe(5420).clock).toBe('01:30:20')
    expect(describe(59).clock).toBe('00:00:59')
    expect(describe(-90).clock).toBe('-00:01:30')
  })

  it('소수 시간·분을 함께 준다 (급여 계산용)', () => {
    expect(describe(5400).decimalHours).toBe(1.5)
    expect(describe(90).decimalMinutes).toBe(1.5)
  })

  it('음수 라벨에 부호를 붙인다', () => {
    expect(describe(-5420).label).toBe('-1시간 30분 20초')
  })
})

group('calcTime · 덧셈 뺄셈', () => {
  it('60진법 덧셈 (계산기로 하면 틀리는 계산)', () => {
    // 1시간 30분 + 45분 = 2시간 15분
    const r = calcTime(hms(1, 30, 0), hms(0, 45, 0), 'add')
    expect(r.label).toBe('2시간 15분')
    expect(r.totalSeconds).toBe(8100)
  })

  it('초 자리 올림', () => {
    const r = calcTime(hms(0, 0, 45), hms(0, 0, 30), 'add')
    expect(r.label).toBe('1분 15초')
  })

  it('뺄셈', () => {
    const r = calcTime(hms(2, 0, 0), hms(0, 45, 30), 'subtract')
    expect(r.label).toBe('1시간 14분 30초')
  })

  it('결과가 음수면 부호를 표시한다', () => {
    const r = calcTime(hms(0, 30, 0), hms(1, 0, 0), 'subtract')
    expect(r.negative).toBe(true)
    expect(r.label).toBe('-30분')
    expect(r.totalSeconds).toBe(-1800)
  })

  it('같은 값을 빼면 0', () => {
    expect(calcTime(hms(1, 2, 3), hms(1, 2, 3), 'subtract').totalSeconds).toBe(0)
  })
})

group('sumTimes · 여러 시간 합산', () => {
  it('근무시간 합계', () => {
    const r = sumTimes([hms(8, 30, 0), hms(7, 45, 0), hms(9, 15, 0)])
    expect(r.label).toBe('25시간 30분')
    expect(r.decimalHours).toBe(25.5)
  })

  it('빈 배열은 0', () => {
    expect(sumTimes([]).totalSeconds).toBe(0)
  })
})
