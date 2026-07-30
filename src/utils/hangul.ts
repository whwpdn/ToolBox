const CHOSEONG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const

const HANGUL_BASE = 0xac00
const HANGUL_LAST = 0xd7a3
const JAMO_PER_CHOSEONG = 588

/** 완성형 한글의 초성만 뽑아낸다. 한글이 아닌 문자는 그대로 남긴다. */
export function toChoseong(text: string): string {
  let out = ''
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (code >= HANGUL_BASE && code <= HANGUL_LAST) {
      out += CHOSEONG[Math.floor((code - HANGUL_BASE) / JAMO_PER_CHOSEONG)] ?? ch
    } else {
      out += ch
    }
  }
  return out
}

/**
 * 입력이 초성(자음)만으로 이뤄졌는지 판단한다.
 * 'ㄷㅊ' → true, '대출' → false, 'ㄱ' → true, '' → false
 */
export function isChoseongOnly(query: string): boolean {
  const compact = query.replace(/\s+/g, '')
  if (!compact) return false
  return [...compact].every((ch) => (CHOSEONG as readonly string[]).includes(ch))
}

/**
 * 대상 문자열의 초성 시퀀스에 질의 초성이 연속 부분열로 포함되는지 검사한다.
 * matchChoseong('대출한도', 'ㄷㅊ') → true
 * matchChoseong('대출한도', 'ㄷㅎ') → false (연속이 아니므로)
 */
export function matchChoseong(target: string, query: string): boolean {
  const q = query.replace(/\s+/g, '')
  if (!q) return false
  return toChoseong(target).replace(/\s+/g, '').includes(q)
}
