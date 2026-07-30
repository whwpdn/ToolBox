import { describe, expect, it } from 'vitest'
import { isChoseongOnly, matchChoseong, toChoseong } from './hangul'

describe('toChoseong', () => {
  it('완성형 한글을 초성으로 바꾼다', () => {
    expect(toChoseong('대출한도')).toBe('ㄷㅊㅎㄷ')
    expect(toChoseong('계산기')).toBe('ㄱㅅㄱ')
    expect(toChoseong('만나이')).toBe('ㅁㄴㅇ')
  })

  it('쌍자음 초성을 구분한다', () => {
    expect(toChoseong('빼기')).toBe('ㅃㄱ')
    expect(toChoseong('땅')).toBe('ㄸ')
  })

  it('한글이 아닌 문자는 그대로 둔다', () => {
    expect(toChoseong('BMI 계산')).toBe('BMI ㄱㅅ')
    expect(toChoseong('123')).toBe('123')
    expect(toChoseong('')).toBe('')
  })
})

describe('isChoseongOnly', () => {
  it('자음만 입력한 경우를 감지한다', () => {
    expect(isChoseongOnly('ㄷㅊ')).toBe(true)
    expect(isChoseongOnly('ㄱ')).toBe(true)
    expect(isChoseongOnly('ㄷ ㅊ')).toBe(true)
  })

  it('완성형·영문·빈 문자열은 초성 질의가 아니다', () => {
    expect(isChoseongOnly('대출')).toBe(false)
    expect(isChoseongOnly('ㄷ출')).toBe(false)
    expect(isChoseongOnly('bmi')).toBe(false)
    expect(isChoseongOnly('')).toBe(false)
    expect(isChoseongOnly('   ')).toBe(false)
  })

  it('모음만 입력한 경우는 초성 질의로 보지 않는다', () => {
    expect(isChoseongOnly('ㅏㅓ')).toBe(false)
  })
})

describe('matchChoseong', () => {
  it('연속된 초성 부분열을 찾는다', () => {
    expect(matchChoseong('대출한도', 'ㄷㅊ')).toBe(true)
    expect(matchChoseong('대출한도', 'ㅊㅎㄷ')).toBe(true)
    expect(matchChoseong('대출한도', 'ㄷㅊㅎㄷ')).toBe(true)
  })

  it('떨어져 있는 초성은 매치하지 않는다', () => {
    expect(matchChoseong('대출한도', 'ㄷㅎ')).toBe(false)
  })

  it('공백은 무시한다', () => {
    expect(matchChoseong('만 나이', 'ㅁㄴㅇ')).toBe(true)
  })

  it('빈 질의는 매치하지 않는다', () => {
    expect(matchChoseong('계산기', '')).toBe(false)
  })
})
