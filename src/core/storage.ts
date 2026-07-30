const PREFIX = 'toolbox.'

interface Envelope<T> {
  /** 저장 구조가 바뀌면 올린다. 버전이 다르면 값을 버리고 기본값으로 시작한다 */
  version: number
  data: T
}

/**
 * localStorage 래퍼.
 * 값이 깨져 있거나 스키마 버전이 다르면 예외를 던지지 않고 기본값으로 되돌린다.
 * 도구 모음의 설정값은 유실돼도 치명적이지 않으므로, 앱이 죽지 않는 쪽을 택했다.
 */
export function load<T>(key: string, version: number, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Envelope<T>
    if (parsed?.version !== version) return fallback
    return parsed.data ?? fallback
  } catch {
    return fallback
  }
}

export function save<T>(key: string, version: number, data: T): void {
  try {
    const envelope: Envelope<T> = { version, data }
    localStorage.setItem(PREFIX + key, JSON.stringify(envelope))
  } catch {
    // 시크릿 모드나 용량 초과 시 저장만 실패시키고 앱은 계속 동작시킨다
  }
}
