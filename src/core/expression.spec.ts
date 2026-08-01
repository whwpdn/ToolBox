import { describe, expect, it } from 'vitest'
import { evaluate, type EvalOptions } from './expression'

const v = (expr: string, opts?: EvalOptions) => evaluate(expr, opts).value
const err = (expr: string, opts?: EvalOptions) => evaluate(expr, opts).error
const deg: EvalOptions = { angle: 'deg' }

describe('거듭제곱 ^', () => {
  it('기본 계산', () => {
    expect(v('2^10')).toBe(1024)
    expect(v('9^0.5')).toBe(3)
  })

  it('우결합이다 (2^3^2 = 2^9)', () => {
    expect(v('2^3^2')).toBe(512)
  })

  it('지수에 부호를 허용한다', () => {
    expect(v('2^-1')).toBe(0.5)
    expect(v('10^-2')).toBeCloseTo(0.01, 12)
  })

  it('곱셈보다 우선한다', () => {
    expect(v('2*3^2')).toBe(18)
    expect(v('3^2*2')).toBe(18)
  })

  it('단항 마이너스보다 우선한다 (-2^2 = -(2^2))', () => {
    expect(v('-2^2')).toBe(-4)
  })
})

describe('삼각함수 · 각도 모드', () => {
  it('rad 기본', () => {
    expect(v('sin(0)')).toBe(0)
    expect(v('cos(0)')).toBe(1)
    expect(v('sin(pi/2)')).toBeCloseTo(1, 12)
  })

  it('deg 모드', () => {
    expect(v('sin(30)', deg)).toBeCloseTo(0.5, 12)
    expect(v('cos(60)', deg)).toBeCloseTo(0.5, 12)
    expect(v('tan(45)', deg)).toBeCloseTo(1, 12)
    expect(v('sin(90)', deg)).toBeCloseTo(1, 12)
  })

  it('tan(90°)는 정의되지 않는다고 알린다 (거대한 수 대신)', () => {
    expect(v('tan(90)', deg)).toBeNull()
    expect(err('tan(90)', deg)).toBe('정의되지 않는 값입니다')
  })

  it('역삼각함수는 각도 모드에 맞춰 돌려준다', () => {
    expect(v('asin(1)', deg)).toBeCloseTo(90, 10)
    expect(v('acos(0)', deg)).toBeCloseTo(90, 10)
    expect(v('atan(1)', deg)).toBeCloseTo(45, 10)
    expect(v('asin(1)')).toBeCloseTo(Math.PI / 2, 12)
  })

  it('asin·acos 정의역을 벗어나면 오류', () => {
    expect(v('asin(2)')).toBeNull()
    expect(err('asin(2)')).toContain('-1 ~ 1')
    expect(v('acos(-3)')).toBeNull()
  })

  it('쌍곡함수는 각도 모드와 무관하다', () => {
    expect(v('sinh(0)')).toBe(0)
    expect(v('cosh(0)')).toBe(1)
    expect(v('tanh(0)')).toBe(0)
  })
})

describe('로그 · 지수 · 근', () => {
  it('상용로그와 자연로그를 구분한다', () => {
    expect(v('log(1000)')).toBeCloseTo(3, 12)
    expect(v('ln(e)')).toBeCloseTo(1, 12)
    expect(v('log2(1024)')).toBe(10)
  })

  it('로그 정의역', () => {
    expect(v('log(0)')).toBeNull()
    expect(v('ln(-1)')).toBeNull()
    expect(err('log(0)')).toContain('0보다 커야')
  })

  it('제곱근·세제곱근', () => {
    expect(v('sqrt(144)')).toBe(12)
    expect(v('cbrt(27)')).toBe(3)
    expect(v('sqrt(-4)')).toBeNull()
    expect(err('sqrt(-4)')).toContain('음수의 제곱근')
  })

  it('exp는 ln의 역함수다', () => {
    expect(v('ln(exp(3))')).toBeCloseTo(3, 12)
  })
})

describe('상수', () => {
  it('pi 와 π 를 모두 받는다', () => {
    expect(v('pi')).toBeCloseTo(Math.PI, 12)
    expect(v('π')).toBeCloseTo(Math.PI, 12)
  })

  it('e', () => {
    expect(v('e')).toBeCloseTo(Math.E, 12)
  })

  it('상수를 식에 섞어 쓴다', () => {
    expect(v('2*pi')).toBeCloseTo(2 * Math.PI, 12)
    expect(v('pi^2')).toBeCloseTo(Math.PI ** 2, 12)
  })

  it('대소문자를 가리지 않는다', () => {
    expect(v('PI')).toBeCloseTo(Math.PI, 12)
    expect(v('SQRT(16)')).toBe(4)
  })
})

describe('팩토리얼 !', () => {
  it('기본 계산', () => {
    expect(v('0!')).toBe(1)
    expect(v('5!')).toBe(120)
    expect(v('10!')).toBe(3_628_800)
  })

  it('식과 조합된다', () => {
    expect(v('(2+3)!')).toBe(120)
    expect(v('3!*2')).toBe(12)
  })

  it('음수·소수는 오류', () => {
    expect(v('(-1)!')).toBeNull()
    expect(v('2.5!')).toBeNull()
  })

  it('170!을 넘으면 오류 (Infinity 대신)', () => {
    expect(v('171!')).toBeNull()
    expect(err('171!')).toBe('계산 결과가 너무 큽니다')
  })
})

describe('중첩 · 복합 수식', () => {
  it('함수 안에 식을 넣는다', () => {
    expect(v('sqrt(3^2+4^2)')).toBe(5)
    expect(v('sin(30+30)', deg)).toBeCloseTo(Math.sin(60 * (Math.PI / 180)), 12)
  })

  it('함수를 중첩한다', () => {
    expect(v('sqrt(sqrt(16))')).toBe(2)
    expect(v('abs(-sqrt(9))')).toBe(3)
  })

  it('삼각함수 항등식 sin²+cos²=1', () => {
    expect(v('sin(37)^2+cos(37)^2', deg)).toBeCloseTo(1, 12)
  })
})

describe('오류 처리', () => {
  it('알 수 없는 함수', () => {
    expect(v('foo(1)')).toBeNull()
    expect(err('foo(1)')).toContain('알 수 없는 함수')
  })

  it('함수 뒤에 괄호가 없으면 오류', () => {
    expect(v('sin')).toBeNull()
    expect(err('sin')).toContain('괄호가 필요')
  })

  it('코드 실행 시도를 차단한다', () => {
    // eval 기반 구현이라면 위험할 입력들
    expect(v('alert(1)')).toBeNull()
    expect(v('process.exit')).toBeNull()
    expect(v('[].constructor')).toBeNull()
    expect(v('1;2')).toBeNull()
    expect(v('globalThis')).toBeNull()
  })

  it('0으로 나누기', () => {
    expect(err('1/0')).toBe('0으로 나눌 수 없습니다')
  })

  it('빈 입력은 오류가 아니라 값 없음', () => {
    expect(evaluate('')).toEqual({ value: null, error: null })
  })
})

describe('기존 사칙연산 동작 유지', () => {
  it('우선순위와 괄호', () => {
    expect(v('2+3*4')).toBe(14)
    expect(v('(2+3)*4')).toBe(20)
    expect(v('10-3-2')).toBe(5)
  })

  it('천단위 구분자', () => {
    expect(v('1,000+2,000')).toBe(3000)
  })

  it('백분율', () => {
    expect(v('50%')).toBe(0.5)
    expect(v('200*10%')).toBe(20)
  })

  it('× ÷ 기호', () => {
    expect(v('6×7')).toBe(42)
    expect(v('84÷2')).toBe(42)
  })
})
