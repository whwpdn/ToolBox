import { describe, expect, it } from 'vitest'
import { evaluate, isComplete } from './logic'

const value = (expr: string) => evaluate(expr).value
const error = (expr: string) => evaluate(expr).error

describe('evaluate · 사칙연산', () => {
  it('기본 연산', () => {
    expect(value('1+2')).toBe(3)
    expect(value('10-4')).toBe(6)
    expect(value('6*7')).toBe(42)
    expect(value('84/2')).toBe(42)
  })

  it('연산자 우선순위를 지킨다', () => {
    expect(value('2+3*4')).toBe(14)
    expect(value('2*3+4')).toBe(10)
    expect(value('10-2*3')).toBe(4)
    expect(value('100/10/2')).toBe(5)
  })

  it('좌결합으로 계산한다', () => {
    expect(value('10-3-2')).toBe(5)
    expect(value('100/5/2')).toBe(10)
  })

  it('괄호가 우선순위를 바꾼다', () => {
    expect(value('(2+3)*4')).toBe(20)
    expect(value('2*(3+4)')).toBe(14)
    expect(value('((1+2)*(3+4))')).toBe(21)
  })

  it('× ÷ 기호도 받는다', () => {
    expect(value('6×7')).toBe(42)
    expect(value('84÷2')).toBe(42)
  })

  it('소수점 계산', () => {
    expect(value('1.5*2')).toBe(3)
    expect(value('0.1+0.2')).toBeCloseTo(0.3, 10)
  })

  it('천단위 구분자와 공백을 무시한다', () => {
    expect(value('1,000+2,000')).toBe(3000)
    expect(value('1 + 2')).toBe(3)
  })
})

describe('evaluate · 부호와 백분율', () => {
  it('단항 마이너스', () => {
    expect(value('-5')).toBe(-5)
    expect(value('-5+3')).toBe(-2)
    expect(value('3*-2')).toBe(-6)
    expect(value('-(2+3)')).toBe(-5)
  })

  it('연속 부호', () => {
    expect(value('--5')).toBe(5)
    expect(value('3--2')).toBe(5)
  })

  it('접미 % 는 100으로 나눈다', () => {
    expect(value('50%')).toBe(0.5)
    expect(value('200*10%')).toBe(20)
    expect(value('10%+10%')).toBeCloseTo(0.2, 10)
  })

  it('% 를 괄호와 함께 쓴다', () => {
    expect(value('(20+30)%')).toBe(0.5)
  })
})

describe('evaluate · 오류 처리', () => {
  it('0으로 나누면 오류 메시지를 돌려준다', () => {
    expect(value('1/0')).toBeNull()
    expect(error('1/0')).toBe('0으로 나눌 수 없습니다')
  })

  it('괄호가 닫히지 않으면 오류', () => {
    expect(error('(1+2')).toBe('괄호가 닫히지 않았습니다')
  })

  it('불완전한 수식은 오류', () => {
    expect(value('1+')).toBeNull()
    expect(value('*5')).toBeNull()
  })

  it('허용되지 않은 문자는 오류', () => {
    expect(error('1+#')).toBe('사용할 수 없는 문자가 있습니다')
    expect(error('1+[2]')).toBe('사용할 수 없는 문자가 있습니다')
  })

  it('알 수 없는 이름은 함수 오류로 안내한다', () => {
    // 공학용 계산기와 파서를 공유하면서 식별자가 유효 토큰이 됐다.
    // 'a'는 문자 오류가 아니라 '모르는 함수'로 안내하는 편이 정확하다.
    expect(value('1+a')).toBeNull()
    expect(error('1+a')).toContain('알 수 없는 함수')
    expect(value('alert(1)')).toBeNull()
  })

  it('코드 실행 시도를 차단한다', () => {
    // eval 기반 구현이라면 위험할 입력들
    expect(value('process.exit')).toBeNull()
    expect(value('1;2')).toBeNull()
    expect(value('[].constructor')).toBeNull()
  })

  it('잘못된 소수점은 오류', () => {
    expect(error('1.2.3')).toBe('사용할 수 없는 문자가 있습니다')
  })

  it('빈 입력은 오류가 아니라 값 없음이다', () => {
    expect(evaluate('')).toEqual({ value: null, error: null })
    expect(evaluate('   ')).toEqual({ value: null, error: null })
  })

  it('계산 결과가 무한대면 오류', () => {
    expect(error('9'.repeat(400))).toBe('계산 결과가 너무 큽니다')
  })

  it('닫는 괄호가 남으면 오류', () => {
    expect(value('1+2)')).toBeNull()
  })
})

describe('isComplete', () => {
  it('계산 가능한 수식만 true', () => {
    expect(isComplete('1+2')).toBe(true)
    expect(isComplete('1+')).toBe(false)
    expect(isComplete('(1+2')).toBe(false)
    expect(isComplete('')).toBe(false)
  })
})
