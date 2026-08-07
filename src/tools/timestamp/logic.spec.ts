import { describe, expect, it } from 'vitest'
import {
  formatInZone,
  fromDateString,
  fromEpoch,
  guessUnit,
  relativeFrom,
  toDateTimeLocal,
} from './logic'

/** 2026-07-30T08:15:00Z */
const EPOCH_MS = 1785399300000
const EPOCH_S = 1785399300
const NOW = EPOCH_MS

describe('guessUnit · 자릿수로 단위 추정', () => {
  it('10자리는 초, 13자리는 밀리초', () => {
    expect(guessUnit(1785399300)).toBe('seconds')
    expect(guessUnit(1785399300000)).toBe('milliseconds')
  })

  it('0과 작은 값은 초로 본다', () => {
    expect(guessUnit(0)).toBe('seconds')
    expect(guessUnit(1)).toBe('seconds')
  })
})

describe('fromEpoch', () => {
  it('초 단위 입력을 해석한다', () => {
    const r = fromEpoch(EPOCH_S, 'seconds', NOW)
    expect(r.valid).toBe(true)
    expect(r.epochMs).toBe(EPOCH_MS)
    expect(r.iso).toBe('2026-07-30T08:15:00.000Z')
  })

  it('밀리초 단위 입력을 해석한다', () => {
    const r = fromEpoch(EPOCH_MS, 'milliseconds', NOW)
    expect(r.epochSeconds).toBe(EPOCH_S)
    expect(r.iso).toBe('2026-07-30T08:15:00.000Z')
  })

  it('UTC 문자열은 시간대와 무관하게 고정이다', () => {
    expect(fromEpoch(EPOCH_S, 'seconds', NOW).utc).toBe('2026-07-30 08:15:00')
  })

  it('epoch 0은 1970-01-01', () => {
    expect(fromEpoch(0, 'seconds', NOW).iso).toBe('1970-01-01T00:00:00.000Z')
  })

  it('음수(1970 이전)도 처리한다', () => {
    expect(fromEpoch(-86400, 'seconds', NOW).iso).toBe('1969-12-31T00:00:00.000Z')
  })

  it('유한하지 않은 값은 valid=false', () => {
    expect(fromEpoch(NaN, 'seconds', NOW).valid).toBe(false)
    expect(fromEpoch(Infinity, 'milliseconds', NOW).valid).toBe(false)
  })

  it('표현할 수 없는 범위는 valid=false', () => {
    // Date가 다루는 최대 범위(±8.64e15ms)를 넘김
    expect(fromEpoch(1e16, 'milliseconds', NOW).valid).toBe(false)
  })

  it('오프셋 라벨 형식', () => {
    const r = fromEpoch(EPOCH_S, 'seconds', NOW)
    expect(r.offsetLabel).toMatch(/^[+-]\d{2}:\d{2}$/)
  })
})

describe('relativeFrom · 상대 시각', () => {
  it('기준과 같으면 방금', () => {
    expect(relativeFrom(NOW, NOW)).toBe('방금')
  })

  it('과거는 전, 미래는 후', () => {
    expect(relativeFrom(NOW - 3600_000, NOW)).toBe('1시간 전')
    expect(relativeFrom(NOW + 3600_000, NOW)).toBe('1시간 후')
  })

  it('단위가 커질수록 큰 단위로 표현한다', () => {
    expect(relativeFrom(NOW - 30_000, NOW)).toBe('30초 전')
    expect(relativeFrom(NOW - 120_000, NOW)).toBe('2분 전')
    expect(relativeFrom(NOW - 86400_000 * 3, NOW)).toBe('3일 전')
    expect(relativeFrom(NOW - 86400_000 * 800, NOW)).toBe('2년 전')
  })
})

describe('fromDateString', () => {
  it('시간대 표기가 있으면 그대로 해석한다', () => {
    expect(fromDateString('2026-07-30T08:15:00Z', false, NOW).epochMs).toBe(EPOCH_MS)
    expect(fromDateString('2026-07-30T17:15:00+09:00', false, NOW).epochMs).toBe(EPOCH_MS)
  })

  it('asUTC를 켜면 시간대 없는 문자열을 UTC로 읽는다', () => {
    expect(fromDateString('2026-07-30T08:15', true, NOW).epochMs).toBe(EPOCH_MS)
  })

  it('이미 시간대가 있으면 asUTC를 무시한다 (Z 중복 방지)', () => {
    expect(fromDateString('2026-07-30T08:15:00Z', true, NOW).epochMs).toBe(EPOCH_MS)
  })

  it('빈 문자열·잘못된 형식은 valid=false', () => {
    expect(fromDateString('', false, NOW).valid).toBe(false)
    expect(fromDateString('   ', false, NOW).valid).toBe(false)
    expect(fromDateString('올해 여름', false, NOW).valid).toBe(false)
  })

  it('fromEpoch 와 왕복이 일치한다', () => {
    const iso = fromEpoch(EPOCH_S, 'seconds', NOW).iso
    expect(fromDateString(iso, false, NOW).epochSeconds).toBe(EPOCH_S)
  })
})

describe('toDateTimeLocal', () => {
  it('datetime-local 형식을 만든다', () => {
    expect(toDateTimeLocal(EPOCH_MS)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('잘못된 값은 빈 문자열', () => {
    expect(toDateTimeLocal(NaN)).toBe('')
  })
})

describe('formatInZone', () => {
  it('시간대별로 다른 시각을 보여준다', () => {
    const seoul = formatInZone(EPOCH_MS, 'Asia/Seoul')
    const utc = formatInZone(EPOCH_MS, 'UTC')
    expect(seoul).not.toBe(utc)
    // 서울은 UTC+9 이므로 17시
    expect(seoul).toContain('17:15')
    expect(utc).toContain('08:15')
  })

  it('모르는 시간대는 하이픈', () => {
    expect(formatInZone(EPOCH_MS, 'Mars/Olympus')).toBe('-')
  })

  it('유한하지 않은 값은 하이픈', () => {
    expect(formatInZone(NaN, 'UTC')).toBe('-')
  })
})
