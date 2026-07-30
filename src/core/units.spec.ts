import { describe, expect, it } from 'vitest'
import { AREA_UNITS, LENGTH_UNITS, VOLUME_UNITS, WEIGHT_UNITS, convert } from './units'

describe('convert · 길이', () => {
  it('미터 기준 배율 변환', () => {
    expect(convert(1, 'm', 'cm', LENGTH_UNITS)).toBeCloseTo(100, 10)
    expect(convert(1, 'km', 'm', LENGTH_UNITS)).toBeCloseTo(1000, 10)
    expect(convert(1000, 'mm', 'm', LENGTH_UNITS)).toBeCloseTo(1, 10)
  })

  it('야드파운드 단위 정확도', () => {
    expect(convert(1, 'in', 'cm', LENGTH_UNITS)).toBeCloseTo(2.54, 10)
    expect(convert(1, 'mi', 'km', LENGTH_UNITS)).toBeCloseTo(1.609344, 10)
    expect(convert(6, 'ft', 'm', LENGTH_UNITS)).toBeCloseTo(1.8288, 10)
  })

  it('자(척)는 10/33 미터', () => {
    expect(convert(33, 'ja', 'm', LENGTH_UNITS)).toBeCloseTo(10, 10)
  })

  it('같은 단위끼리는 값이 보존된다', () => {
    expect(convert(42.5, 'm', 'm', LENGTH_UNITS)).toBeCloseTo(42.5, 10)
  })
})

describe('convert · 무게', () => {
  it('SI 단위 변환', () => {
    expect(convert(1, 'kg', 'g', WEIGHT_UNITS)).toBeCloseTo(1000, 10)
    expect(convert(1, 't', 'kg', WEIGHT_UNITS)).toBeCloseTo(1000, 10)
  })

  it('파운드·온스 정확도', () => {
    expect(convert(1, 'lb', 'kg', WEIGHT_UNITS)).toBeCloseTo(0.45359237, 10)
    expect(convert(16, 'oz', 'lb', WEIGHT_UNITS)).toBeCloseTo(1, 9)
  })

  it('한국 전통 단위', () => {
    expect(convert(1, 'geun', 'g', WEIGHT_UNITS)).toBeCloseTo(600, 8)
    expect(convert(1, 'don', 'g', WEIGHT_UNITS)).toBeCloseTo(3.75, 10)
    expect(convert(1, 'gwan', 'don', WEIGHT_UNITS)).toBeCloseTo(1000, 8)
  })
})

describe('convert · 면적', () => {
  it('평 ↔ ㎡ (1평 = 400/121 ㎡ ≈ 3.3058)', () => {
    expect(convert(1, 'pyeong', 'm2', AREA_UNITS)).toBeCloseTo(3.305785, 5)
    expect(convert(84, 'm2', 'pyeong', AREA_UNITS)).toBeCloseTo(25.41, 2)
    // 국민주택 84㎡가 '25평형'으로 불리는 것과 일치하는지 확인
  })

  it('제곱미터 기준 배율', () => {
    expect(convert(1, 'ha', 'm2', AREA_UNITS)).toBeCloseTo(10000, 10)
    expect(convert(1, 'km2', 'ha', AREA_UNITS)).toBeCloseTo(100, 10)
  })

  it('정보 = 3000평', () => {
    expect(convert(1, 'jeongbo', 'pyeong', AREA_UNITS)).toBeCloseTo(3000, 6)
  })
})

describe('convert · 부피', () => {
  it('리터 기준 배율', () => {
    expect(convert(1, 'l', 'ml', VOLUME_UNITS)).toBeCloseTo(1000, 10)
    expect(convert(1, 'm3', 'l', VOLUME_UNITS)).toBeCloseTo(1000, 10)
    expect(convert(1, 'cm3', 'ml', VOLUME_UNITS)).toBeCloseTo(1, 10)
  })

  it('갤런(US/UK)을 구분한다', () => {
    expect(convert(1, 'galUS', 'l', VOLUME_UNITS)).toBeCloseTo(3.785411784, 10)
    expect(convert(1, 'galUK', 'l', VOLUME_UNITS)).toBeCloseTo(4.54609, 10)
  })
})

describe('convert · 예외 처리', () => {
  it('알 수 없는 단위 코드는 0', () => {
    expect(convert(1, 'nope', 'm', LENGTH_UNITS)).toBe(0)
    expect(convert(1, 'm', 'nope', LENGTH_UNITS)).toBe(0)
  })

  it('유한하지 않은 입력은 0', () => {
    expect(convert(NaN, 'm', 'cm', LENGTH_UNITS)).toBe(0)
    expect(convert(Infinity, 'm', 'cm', LENGTH_UNITS)).toBe(0)
  })

  it('왕복 변환 시 값이 보존된다', () => {
    const round = convert(convert(123.456, 'm', 'ft', LENGTH_UNITS), 'ft', 'm', LENGTH_UNITS)
    expect(round).toBeCloseTo(123.456, 8)
  })
})
