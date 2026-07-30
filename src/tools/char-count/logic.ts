export interface CharCountResult {
  /** 공백 포함 글자 수 */
  withSpaces: number
  /** 공백 제외 글자 수 */
  withoutSpaces: number
  /** 줄바꿈까지 제외한 글자 수 (자소서 기준에서 흔히 쓰임) */
  withoutWhitespace: number
  words: number
  lines: number
  paragraphs: number
  sentences: number
  /** UTF-8 바이트 (한글 3바이트) */
  bytesUtf8: number
  /** EUC-KR 바이트 (한글 2바이트). 관공서 양식에서 쓰임 */
  bytesEucKr: number
}

/**
 * 글자 수는 '무엇을 세는가'가 서비스마다 달라서 분쟁이 잦다.
 * 자소서·이력서 폼은 보통 공백 포함, 트위터류는 문자 단위, 관공서 양식은 바이트 단위를 쓴다.
 * 그래서 한 번에 여러 기준을 모두 보여준다.
 *
 * 글자 수는 코드 유닛이 아니라 코드 포인트로 센다.
 * 이모지처럼 서로게이트 페어로 표현되는 문자를 2글자로 세면 사용자의 기대와 어긋난다.
 */
export function countText(text: string): CharCountResult {
  const chars = [...text]

  const withSpaces = chars.length
  const withoutSpaces = chars.filter((c) => c !== ' ').length
  const withoutWhitespace = chars.filter((c) => !/\s/.test(c)).length

  const trimmed = text.trim()
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length
  const lines = text === '' ? 0 : text.split(/\r\n|\r|\n/).length
  const paragraphs = trimmed === '' ? 0 : trimmed.split(/(?:\r\n|\r|\n)\s*(?:\r\n|\r|\n)+/).length

  // 문장 부호로 끝나는 덩어리를 센다. 완벽한 문장 분리는 불가능하므로 근사값이다.
  const sentences = trimmed === '' ? 0 : (trimmed.match(/[^.!?。！？]+[.!?。！？]*/g)?.length ?? 0)

  return {
    withSpaces,
    withoutSpaces,
    withoutWhitespace,
    words,
    lines,
    paragraphs,
    sentences,
    bytesUtf8: utf8Bytes(text),
    bytesEucKr: eucKrBytes(text),
  }
}

export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length
}

/**
 * EUC-KR 바이트 수를 계산한다.
 * 브라우저 TextEncoder는 UTF-8만 지원하므로, 문자 범위로 직접 판정한다.
 * 한글·한자·전각 문자는 2바이트, ASCII는 1바이트로 센다.
 */
export function eucKrBytes(text: string): number {
  let bytes = 0
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0
    if (code <= 0x7f) {
      bytes += 1
    } else if (code > 0xffff) {
      // EUC-KR로 표현할 수 없는 문자(이모지 등). UTF-8 기준으로 대신 센다.
      bytes += 4
    } else {
      bytes += 2
    }
  }
  return bytes
}
