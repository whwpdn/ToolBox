import { describe, expect, it } from 'vitest'
import { calcPercent, percentApply, percentChange, percentOf, percentRatio } from './logic'

describe('percentOf · A의 B%', () => {
  it('기본 계산', () => {
    expect(percentOf(50000, 10).value).toBe(5000)
    expect(percentOf(200, 15).value).toBe(30)
  })

  it('100%는 원래 값', () => {
    expect(percentOf(1234, 100).value).toBe(1234)
  })

  it('0%는 0', () => {
    expect(percentOf(1234, 0).value).toBe(0)
  })

  it('100%를 넘는 비율도 계산한다', () => {
    expect(percentOf(1000, 250).value).toBe(2500)
  })
})

describe('percentRatio · A는 B의 몇 %', () => {
  it('기본 계산', () => {
    expect(percentRatio(25, 200).value).toBe(12.5)
    expect(percentRatio(50, 50).value).toBe(100)
  })

  it('전체값이 0이면 0을 돌려주고 안내 문구를 남긴다 (Infinity 방지)', () => {
    const r = percentRatio(50, 0)
    expect(r.value).toBe(0)
    expect(r.formula).toContain('0이면')
  })

  it('부분값이 전체값보다 크면 100%를 넘는다', () => {
    expect(percentRatio(300, 200).value).toBe(150)
  })
})

describe('percentChange · 증감률', () => {
  it('증가', () => {
    expect(percentChange(100, 150).value).toBe(50)
    expect(percentChange(2000, 2500).value).toBe(25)
  })

  it('감소는 음수로 나온다', () => {
    expect(percentChange(100, 80).value).toBe(-20)
    expect(percentChange(1000, 250).value).toBe(-75)
  })

  it('변화가 없으면 0%', () => {
    expect(percentChange(500, 500).value).toBe(0)
  })

  it('기준값이 0이면 0을 돌려준다 (Infinity 방지)', () => {
    const r = percentChange(0, 100)
    expect(r.value).toBe(0)
    expect(r.formula).toContain('0이면')
  })

  it('음수에서의 변화도 계산한다', () => {
    expect(percentChange(-100, -50).value).toBe(-50)
  })
})

describe('percentApply · 증감 적용', () => {
  it('증가 적용', () => {
    expect(percentApply(10000, 10).value).toBe(11000)
  })

  it('감소 적용', () => {
    expect(percentApply(10000, -10).value).toBe(9000)
  })

  it('증가 후 같은 비율로 감소하면 원래 값으로 돌아오지 않는다', () => {
    // 흔한 착각을 검증: 100 → +10% → 110 → -10% → 99
    const up = percentApply(100, 10).value
    const down = percentApply(up, -10).value
    // 부동소수 오차는 표시 단계(formatSignificant)에서 걸러지므로 로직은 근사 비교한다
    expect(down).toBeCloseTo(99, 9)
    expect(down).not.toBe(100)
  })

  it('부호에 따라 계산식 문구가 바뀐다', () => {
    expect(percentApply(100, 10).formula).toContain('+')
    expect(percentApply(100, -10).formula).toContain('−')
  })

  it('percentChange 와 왕복이 일치한다', () => {
    const applied = percentApply(2500, 32).value
    expect(percentChange(2500, applied).value).toBeCloseTo(32, 10)
  })
})

describe('calcPercent · 모드 분기', () => {
  it('각 모드가 해당 함수를 호출한다', () => {
    expect(calcPercent('of', 200, 15).value).toBe(percentOf(200, 15).value)
    expect(calcPercent('ratio', 25, 200).value).toBe(percentRatio(25, 200).value)
    expect(calcPercent('change', 100, 150).value).toBe(percentChange(100, 150).value)
    expect(calcPercent('apply', 100, 10).value).toBe(percentApply(100, 10).value)
  })

  it('비율을 돌려주는 모드만 단위가 %다', () => {
    expect(calcPercent('ratio', 25, 200).unit).toBe('%')
    expect(calcPercent('change', 100, 150).unit).toBe('%')
    expect(calcPercent('of', 200, 15).unit).toBe('')
    expect(calcPercent('apply', 100, 10).unit).toBe('')
  })
})
