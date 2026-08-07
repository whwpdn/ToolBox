/**
 * 유닉스 타임스탬프 · UTC · 현지 시각 변환.
 *
 * 시간대 계산은 브라우저의 Intl API에 맡긴다. 오프셋을 직접 더하면
 * 서머타임(DST)이 있는 지역에서 틀리기 때문이다. 한국은 DST가 없지만
 * 다른 도시를 함께 보여주므로 안전한 쪽을 택했다.
 */

export type TimestampUnit = 'seconds' | 'milliseconds'

export interface TimestampView {
  valid: boolean
  /** 밀리초 단위 유닉스 시각 */
  epochMs: number
  epochSeconds: number
  /** 2026-07-30T08:15:00.000Z */
  iso: string
  /** UTC 기준 사람이 읽는 형식 */
  utc: string
  /** 브라우저 시간대 기준 */
  local: string
  /** 브라우저 시간대 이름 (Asia/Seoul) */
  localZone: string
  /** UTC 대비 오프셋 (분). 한국은 +540 */
  offsetMinutes: number
  /** +09:00 */
  offsetLabel: string
  weekday: string
  /** 지금으로부터 얼마나 떨어져 있는지 */
  relative: string
}

const INVALID: TimestampView = {
  valid: false,
  epochMs: 0,
  epochSeconds: 0,
  iso: '',
  utc: '',
  local: '',
  localZone: '',
  offsetMinutes: 0,
  offsetLabel: '',
  weekday: '',
  relative: '',
}

/** 자릿수로 초/밀리초를 추정한다. 10자리면 초, 13자리면 밀리초 */
export function guessUnit(value: number): TimestampUnit {
  return Math.abs(value) >= 1e11 ? 'milliseconds' : 'seconds'
}

function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const h = String(Math.floor(abs / 60)).padStart(2, '0')
  const m = String(abs % 60).padStart(2, '0')
  return `${sign}${h}:${m}`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 'YYYY-MM-DD HH:mm:ss' (UTC 기준) */
function formatUTC(d: Date): string {
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  )
}

/** 'YYYY-MM-DD HH:mm:ss' (브라우저 시간대 기준) */
function formatLocal(d: Date): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

/** 기준 시각(now) 대비 상대 표현. 테스트를 위해 now를 주입받는다 */
export function relativeFrom(epochMs: number, nowMs: number): string {
  const diff = Math.round((epochMs - nowMs) / 1000)
  const abs = Math.abs(diff)
  const suffix = diff >= 0 ? '후' : '전'

  if (abs < 10) return '방금'
  if (abs < 60) return `${abs}초 ${suffix}`
  if (abs < 3600) return `${Math.floor(abs / 60)}분 ${suffix}`
  if (abs < 86400) return `${Math.floor(abs / 3600)}시간 ${suffix}`
  if (abs < 86400 * 365) return `${Math.floor(abs / 86400)}일 ${suffix}`
  return `${Math.floor(abs / (86400 * 365))}년 ${suffix}`
}

/** 유닉스 타임스탬프 → 각종 표현 */
export function fromEpoch(value: number, unit: TimestampUnit, nowMs: number): TimestampView {
  if (!Number.isFinite(value)) return INVALID

  const epochMs = unit === 'seconds' ? Math.round(value * 1000) : Math.round(value)
  const date = new Date(epochMs)
  if (Number.isNaN(date.getTime())) return INVALID

  // getTimezoneOffset은 UTC 기준 '뒤처진 분'을 주므로 부호를 뒤집는다
  const offsetMinutes = -date.getTimezoneOffset()

  return {
    valid: true,
    epochMs,
    epochSeconds: Math.floor(epochMs / 1000),
    iso: date.toISOString(),
    utc: formatUTC(date),
    local: formatLocal(date),
    localZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offsetMinutes,
    offsetLabel: formatOffset(offsetMinutes),
    weekday: WEEKDAYS[date.getDay()] ?? '',
    relative: relativeFrom(epochMs, nowMs),
  }
}

/**
 * 날짜 문자열 → 유닉스 시각.
 *
 * 'YYYY-MM-DDTHH:mm' (datetime-local 입력) 은 시간대 표기가 없어
 * 브라우저가 현지 시각으로 해석한다. asUTC를 켜면 UTC로 읽는다.
 */
export function fromDateString(text: string, asUTC: boolean, nowMs: number): TimestampView {
  const trimmed = text.trim()
  if (!trimmed) return INVALID

  // 시간대 표기가 이미 있으면 그대로 맡긴다
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed)
  const normalized = asUTC && !hasZone ? `${trimmed}Z` : trimmed

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return INVALID

  return fromEpoch(parsed.getTime(), 'milliseconds', nowMs)
}

/** datetime-local 입력에 넣을 'YYYY-MM-DDTHH:mm' (현지 시각) */
export function toDateTimeLocal(epochMs: number): string {
  const d = new Date(epochMs)
  if (Number.isNaN(d.getTime())) return ''
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

/** 함께 보여줄 주요 도시 */
export const CITIES: Array<{ zone: string; label: string }> = [
  { zone: 'Asia/Seoul', label: '서울' },
  { zone: 'UTC', label: 'UTC' },
  { zone: 'America/New_York', label: '뉴욕' },
  { zone: 'America/Los_Angeles', label: 'LA' },
  { zone: 'Europe/London', label: '런던' },
  { zone: 'Asia/Tokyo', label: '도쿄' },
]

/**
 * 특정 시간대의 시각 문자열.
 * Intl에 맡기므로 서머타임이 자동 반영된다.
 */
export function formatInZone(epochMs: number, zone: string): string {
  if (!Number.isFinite(epochMs)) return '-'
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(epochMs))
  } catch {
    // 브라우저가 모르는 시간대 이름이면 조용히 넘어간다
    return '-'
  }
}
