import { describe, expect, it } from 'vitest'
import { FORMULAS, computeFormula, searchFormulas } from './logic'

const byId = (id: string) => {
  const found = FORMULAS.find((f) => f.id === id)
  if (!found) throw new Error(`공식 없음: ${id}`)
  return found
}

describe('공식 목록 정합성', () => {
  it('id가 중복되지 않는다', () => {
    const ids = FORMULAS.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('모든 공식이 입력값과 결과 라벨을 가진다', () => {
    for (const f of FORMULAS) {
      expect(f.inputs.length).toBeGreaterThan(0)
      expect(f.resultLabel).toBeTruthy()
      expect(f.expression).toBeTruthy()
    }
  })

  it('모든 공식이 기본값으로 계산 가능하다', () => {
    for (const f of FORMULAS) {
      const values = Object.fromEntries(f.inputs.map((i) => [i.key, i.value]))
      expect(computeFormula(f, values), `${f.id} 계산 실패`).not.toBeNull()
    }
  })

  it('입력 key가 공식 안에서 중복되지 않는다', () => {
    for (const f of FORMULAS) {
      const keys = f.inputs.map((i) => i.key)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })
})

describe('computeFormula · 도형', () => {
  it('원의 면적 (r=5) = 78.539816', () => {
    expect(computeFormula(byId('circle-area'), { r: 5 })).toBeCloseTo(78.539816, 5)
  })

  it('원의 둘레 (r=5) = 31.415927', () => {
    expect(computeFormula(byId('circle-circumference'), { r: 5 })).toBeCloseTo(31.415927, 5)
  })

  it('삼각형 면적 (밑변 10, 높이 6) = 30', () => {
    expect(computeFormula(byId('triangle-area'), { b: 10, h: 6 })).toBe(30)
  })

  it('사다리꼴 면적 (4, 8, 5) = 30', () => {
    expect(computeFormula(byId('trapezoid-area'), { a: 4, b: 8, h: 5 })).toBe(30)
  })

  it('피타고라스 3-4-5 삼각형', () => {
    expect(computeFormula(byId('pythagorean'), { a: 3, b: 4 })).toBe(5)
    expect(computeFormula(byId('pythagorean'), { a: 5, b: 12 })).toBe(13)
  })

  it('구의 부피 (r=5)', () => {
    expect(computeFormula(byId('sphere-volume'), { r: 5 })).toBeCloseTo(523.598776, 5)
  })

  it('구의 표면적 (r=5)', () => {
    expect(computeFormula(byId('sphere-area'), { r: 5 })).toBeCloseTo(314.159265, 5)
  })

  it('원기둥 부피 = 원 면적 × 높이', () => {
    const cylinder = computeFormula(byId('cylinder-volume'), { r: 3, h: 10 })!
    const circle = computeFormula(byId('circle-area'), { r: 3 })!
    expect(cylinder).toBeCloseTo(circle * 10, 4)
  })

  it('원뿔 부피는 같은 크기 원기둥의 1/3이다', () => {
    const cone = computeFormula(byId('cone-volume'), { r: 3, h: 10 })!
    const cylinder = computeFormula(byId('cylinder-volume'), { r: 3, h: 10 })!
    expect(cone).toBeCloseTo(cylinder / 3, 4)
  })

  it('직육면체 부피', () => {
    expect(computeFormula(byId('box-volume'), { w: 10, d: 20, h: 30 })).toBe(6000)
  })
})

describe('computeFormula · 방정식', () => {
  it('판별식 x²−3x+2 → D=1', () => {
    expect(computeFormula(byId('quadratic-discriminant'), { a: 1, b: -3, c: 2 })).toBe(1)
  })

  it('중근이면 D=0', () => {
    expect(computeFormula(byId('quadratic-discriminant'), { a: 1, b: -2, c: 1 })).toBe(0)
  })

  it('허근이면 D<0', () => {
    expect(computeFormula(byId('quadratic-discriminant'), { a: 1, b: 0, c: 1 })).toBe(-4)
  })

  it('근의 공식 x²−3x+2 → x=2', () => {
    expect(computeFormula(byId('quadratic-root1'), { a: 1, b: -3, c: 2 })).toBe(2)
  })

  it('a=0이면 계산 불가(null)', () => {
    expect(computeFormula(byId('quadratic-root1'), { a: 0, b: 1, c: 1 })).toBeNull()
  })

  it('판별식이 음수면 실근이 없어 null', () => {
    expect(computeFormula(byId('quadratic-root1'), { a: 1, b: 0, c: 1 })).toBeNull()
  })
})

describe('computeFormula · 0으로 나누기 방어', () => {
  it('시간이 0이면 속력은 null', () => {
    expect(computeFormula(byId('speed'), { d: 120, t: 0 })).toBeNull()
  })

  it('정상 입력은 값을 돌려준다', () => {
    expect(computeFormula(byId('speed'), { d: 120, t: 2 })).toBe(60)
  })

  it('면적 역산은 원 면적 공식의 역함수다', () => {
    const area = computeFormula(byId('circle-area'), { r: 5 })!
    expect(computeFormula(byId('circle-from-area'), { s: area })).toBeCloseTo(5, 5)
  })
})

describe('searchFormulas', () => {
  it('빈 질의는 전체를 돌려준다', () => {
    expect(searchFormulas('')).toHaveLength(FORMULAS.length)
    expect(searchFormulas('   ')).toHaveLength(FORMULAS.length)
  })

  it('제목으로 찾는다', () => {
    const found = searchFormulas('원의 면적')
    expect(found.some((f) => f.id === 'circle-area')).toBe(true)
  })

  it('키워드로 찾는다', () => {
    expect(searchFormulas('피타고라스').some((f) => f.id === 'pythagorean')).toBe(true)
    expect(searchFormulas('택배').some((f) => f.id === 'box-volume')).toBe(true)
  })

  it('영문 키워드로 찾는다', () => {
    expect(searchFormulas('sphere').length).toBeGreaterThan(0)
    expect(searchFormulas('VOLUME').length).toBeGreaterThan(0) // 대소문자 무시
  })

  it('그룹명으로 찾는다', () => {
    expect(searchFormulas('입체도형').length).toBeGreaterThan(0)
  })

  it('없는 검색어는 빈 배열', () => {
    expect(searchFormulas('존재하지않는공식xyz')).toEqual([])
  })
})
