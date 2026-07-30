import { describe, expect, it } from 'vitest'
import { countText, eucKrBytes, utf8Bytes } from './logic'

describe('countText · 글자 수', () => {
  it('공백 포함·제외를 구분한다', () => {
    const r = countText('안녕 하세요')
    expect(r.withSpaces).toBe(6)
    expect(r.withoutSpaces).toBe(5)
  })

  it('줄바꿈까지 제외한 수를 따로 센다', () => {
    const r = countText('가 나\n다')
    expect(r.withSpaces).toBe(5) // '가',' ','나','\n','다'
    expect(r.withoutSpaces).toBe(4) // 줄바꿈은 공백이 아님
    expect(r.withoutWhitespace).toBe(3)
  })

  it('빈 문자열은 모두 0', () => {
    const r = countText('')
    expect(r.withSpaces).toBe(0)
    expect(r.words).toBe(0)
    expect(r.lines).toBe(0)
    expect(r.paragraphs).toBe(0)
    expect(r.sentences).toBe(0)
  })

  it('이모지를 1글자로 센다 (서로게이트 페어)', () => {
    // '👍'는 UTF-16 코드 유닛 2개지만 사용자에게는 1글자다
    expect(countText('👍').withSpaces).toBe(1)
    expect('👍'.length).toBe(2) // 순수 .length는 2를 반환
    expect(countText('a👍b').withSpaces).toBe(3)
  })
})

describe('countText · 단어·줄·문단', () => {
  it('공백으로 단어를 나눈다', () => {
    expect(countText('hello world').words).toBe(2)
    expect(countText('  여러   공백   무시  ').words).toBe(3)
  })

  it('줄 수를 센다', () => {
    expect(countText('한 줄').lines).toBe(1)
    expect(countText('첫줄\n둘째줄').lines).toBe(2)
    expect(countText('첫줄\r\n둘째줄').lines).toBe(2)
    expect(countText('끝에 줄바꿈\n').lines).toBe(2) // 마지막 빈 줄도 한 줄로 센다
  })

  it('빈 줄로 문단을 나눈다', () => {
    expect(countText('문단1\n\n문단2').paragraphs).toBe(2)
    expect(countText('문단1\n줄바꿈만').paragraphs).toBe(1)
    expect(countText('문단1\n\n\n문단2').paragraphs).toBe(2)
  })

  it('문장 부호로 문장을 센다', () => {
    expect(countText('첫 문장. 두번째 문장!').sentences).toBe(2)
    expect(countText('의문문인가? 그렇다.').sentences).toBe(2)
    expect(countText('부호 없는 문장').sentences).toBe(1)
  })
})

describe('utf8Bytes', () => {
  it('ASCII는 1바이트', () => {
    expect(utf8Bytes('abc')).toBe(3)
  })

  it('한글은 3바이트', () => {
    expect(utf8Bytes('한')).toBe(3)
    expect(utf8Bytes('한글')).toBe(6)
  })

  it('이모지는 4바이트', () => {
    expect(utf8Bytes('👍')).toBe(4)
  })

  it('빈 문자열은 0', () => {
    expect(utf8Bytes('')).toBe(0)
  })
})

describe('eucKrBytes', () => {
  it('ASCII는 1바이트', () => {
    expect(eucKrBytes('abc')).toBe(3)
    expect(eucKrBytes('a b')).toBe(3)
  })

  it('한글은 2바이트', () => {
    expect(eucKrBytes('한')).toBe(2)
    expect(eucKrBytes('한글')).toBe(4)
  })

  it('한글과 영문이 섞인 경우', () => {
    // '한글abc' = 2+2+1+1+1 = 7
    expect(eucKrBytes('한글abc')).toBe(7)
  })

  it('UTF-8보다 한글에서 작다', () => {
    expect(eucKrBytes('한글날')).toBeLessThan(utf8Bytes('한글날'))
  })

  it('EUC-KR로 표현 못하는 문자는 4바이트로 센다', () => {
    expect(eucKrBytes('👍')).toBe(4)
  })
})
