import { describe, expect, it } from 'vitest'
import { BMI_CATEGORIES, calcBmi, classifyBmi } from './logic'

describe('calcBmi', () => {
  it('BMI = 체중 ÷ 신장(m)²', () => {
    // 70 / 1.75² = 22.857... → 22.86
    expect(calcBmi(175, 70).bmi).toBe(22.86)
    // 60 / 1.6² = 23.4375 → 23.44
    expect(calcBmi(160, 60).bmi).toBe(23.44)
  })

  it('정상 체중 범위를 계산한다 (BMI 18.5~23)', () => {
    const r = calcBmi(175, 70)
    expect(r.normalWeightMin).toBe(56.7) // 18.5 × 1.75²
    expect(r.normalWeightMax).toBe(70.4) // 23 × 1.75²
  })

  it('표준체중은 BMI 22 기준이다', () => {
    expect(calcBmi(175, 70).standardWeight).toBe(67.4) // 22 × 1.75²
  })

  it('정상 범위 안이면 조절할 체중이 0이다', () => {
    expect(calcBmi(175, 65).weightToLose).toBe(0)
  })

  it('과체중이면 감량할 체중이 양수다', () => {
    const r = calcBmi(175, 85)
    expect(r.weightToLose).toBeGreaterThan(0)
    expect(r.weightToLose).toBe(14.6) // 85 − 70.4
  })

  it('저체중이면 증량할 체중이 음수다', () => {
    const r = calcBmi(175, 50)
    expect(r.weightToLose).toBeLessThan(0)
    expect(r.weightToLose).toBe(-6.7) // 50 − 56.7
  })

  it('키나 체중이 0 이하면 valid=false 이고 NaN이 없다', () => {
    expect(calcBmi(0, 70).valid).toBe(false)
    expect(calcBmi(175, 0).valid).toBe(false)
    expect(calcBmi(-175, 70).valid).toBe(false)
    expect(calcBmi(0, 0).bmi).toBe(0)
  })
})

describe('classifyBmi · 대한비만학회 기준', () => {
  it('구간별 분류', () => {
    expect(classifyBmi(17).label).toBe('저체중')
    expect(classifyBmi(20).label).toBe('정상')
    expect(classifyBmi(24).label).toBe('과체중')
    expect(classifyBmi(27).label).toBe('비만 1단계')
    expect(classifyBmi(32).label).toBe('비만 2단계')
    expect(classifyBmi(40).label).toBe('비만 3단계')
  })

  it('경계값은 상위 구간에 포함된다 (이상 ~ 미만)', () => {
    expect(classifyBmi(18.5).label).toBe('정상')
    expect(classifyBmi(18.49).label).toBe('저체중')
    expect(classifyBmi(23).label).toBe('과체중')
    expect(classifyBmi(25).label).toBe('비만 1단계')
    expect(classifyBmi(30).label).toBe('비만 2단계')
    expect(classifyBmi(35).label).toBe('비만 3단계')
  })

  it('0과 매우 큰 값도 구간을 찾는다', () => {
    expect(classifyBmi(0).label).toBe('저체중')
    expect(classifyBmi(1000).label).toBe('비만 3단계')
  })

  it('구간이 빈틈이나 겹침 없이 이어진다', () => {
    for (let i = 1; i < BMI_CATEGORIES.length; i += 1) {
      expect(BMI_CATEGORIES[i]!.min).toBe(BMI_CATEGORIES[i - 1]!.max)
    }
    expect(BMI_CATEGORIES[0]!.min).toBe(0)
    expect(BMI_CATEGORIES.at(-1)!.max).toBe(Infinity)
  })
})
