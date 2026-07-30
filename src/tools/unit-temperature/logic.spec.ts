import { describe, expect, it } from 'vitest'
import { convertTemperature, isBelowAbsoluteZero } from './logic'

describe('convertTemperature · 섭씨 ↔ 화씨', () => {
  it('물의 어는점과 끓는점', () => {
    expect(convertTemperature(0, 'c', 'f')).toBeCloseTo(32, 10)
    expect(convertTemperature(100, 'c', 'f')).toBeCloseTo(212, 10)
    expect(convertTemperature(32, 'f', 'c')).toBeCloseTo(0, 10)
    expect(convertTemperature(212, 'f', 'c')).toBeCloseTo(100, 10)
  })

  it('체온 36.5℃ = 97.7℉', () => {
    expect(convertTemperature(36.5, 'c', 'f')).toBeCloseTo(97.7, 10)
  })

  it('-40도는 두 단위가 같아지는 지점이다', () => {
    expect(convertTemperature(-40, 'c', 'f')).toBeCloseTo(-40, 10)
    expect(convertTemperature(-40, 'f', 'c')).toBeCloseTo(-40, 10)
  })
})

describe('convertTemperature · 켈빈', () => {
  it('절대영도', () => {
    expect(convertTemperature(0, 'k', 'c')).toBeCloseTo(-273.15, 10)
    expect(convertTemperature(-273.15, 'c', 'k')).toBeCloseTo(0, 10)
  })

  it('0℃ = 273.15K', () => {
    expect(convertTemperature(0, 'c', 'k')).toBeCloseTo(273.15, 10)
  })

  it('켈빈 → 화씨', () => {
    expect(convertTemperature(300, 'k', 'f')).toBeCloseTo(80.33, 8)
  })
})

describe('convertTemperature · 랭킨', () => {
  it('절대영도는 0°R', () => {
    expect(convertTemperature(0, 'r', 'c')).toBeCloseTo(-273.15, 8)
    expect(convertTemperature(-273.15, 'c', 'r')).toBeCloseTo(0, 8)
  })

  it('0℉ = 459.67°R', () => {
    expect(convertTemperature(0, 'f', 'r')).toBeCloseTo(459.67, 8)
  })
})

describe('convertTemperature · 항등성·예외', () => {
  it('같은 단위끼리는 값이 보존된다', () => {
    expect(convertTemperature(25.5, 'c', 'c')).toBeCloseTo(25.5, 10)
    expect(convertTemperature(25.5, 'f', 'f')).toBeCloseTo(25.5, 10)
  })

  it('왕복 변환 시 값이 보존된다', () => {
    const round = convertTemperature(convertTemperature(36.5, 'c', 'f'), 'f', 'c')
    expect(round).toBeCloseTo(36.5, 10)
  })

  it('알 수 없는 단위는 0', () => {
    expect(convertTemperature(100, 'x', 'c')).toBe(0)
    expect(convertTemperature(100, 'c', 'x')).toBe(0)
  })

  it('유한하지 않은 입력은 0', () => {
    expect(convertTemperature(NaN, 'c', 'f')).toBe(0)
    expect(convertTemperature(Infinity, 'c', 'f')).toBe(0)
  })
})

describe('isBelowAbsoluteZero', () => {
  it('절대영도 미만을 감지한다', () => {
    expect(isBelowAbsoluteZero(-300, 'c')).toBe(true)
    expect(isBelowAbsoluteZero(-1, 'k')).toBe(true)
    expect(isBelowAbsoluteZero(-500, 'f')).toBe(true)
  })

  it('절대영도 자체는 유효한 값이다', () => {
    expect(isBelowAbsoluteZero(-273.15, 'c')).toBe(false)
    expect(isBelowAbsoluteZero(0, 'k')).toBe(false)
    expect(isBelowAbsoluteZero(0, 'r')).toBe(false)
  })

  it('일반적인 온도는 false', () => {
    expect(isBelowAbsoluteZero(20, 'c')).toBe(false)
    expect(isBelowAbsoluteZero(-40, 'c')).toBe(false)
  })
})
