import { round } from '@/utils/number'

export interface BmiCategory {
  label: string
  /** 이 구간의 하한 (이상) */
  min: number
  /** 이 구간의 상한 (미만). 마지막 구간은 Infinity */
  max: number
  tone: 'low' | 'normal' | 'warn' | 'danger'
}

/**
 * 대한비만학회 기준(아시아-태평양 기준).
 * WHO 국제 기준(과체중 25~30, 비만 30 이상)과 다르므로 도구에 함께 표기한다.
 */
export const BMI_CATEGORIES: BmiCategory[] = [
  { label: '저체중', min: 0, max: 18.5, tone: 'low' },
  { label: '정상', min: 18.5, max: 23, tone: 'normal' },
  { label: '과체중', min: 23, max: 25, tone: 'warn' },
  { label: '비만 1단계', min: 25, max: 30, tone: 'danger' },
  { label: '비만 2단계', min: 30, max: 35, tone: 'danger' },
  { label: '비만 3단계', min: 35, max: Infinity, tone: 'danger' },
]

export interface BmiResult {
  valid: boolean
  bmi: number
  category: BmiCategory
  /** 정상 범위(18.5~23)에 해당하는 체중 (kg) */
  normalWeightMin: number
  normalWeightMax: number
  /** 정상 범위까지 조절해야 하는 체중. 양수면 감량, 음수면 증량 */
  weightToLose: number
  /** 표준체중 (BMI 22 기준) */
  standardWeight: number
}

export function classifyBmi(bmi: number): BmiCategory {
  const found = BMI_CATEGORIES.find((c) => bmi >= c.min && bmi < c.max)
  return found ?? BMI_CATEGORIES[0]!
}

/**
 * BMI = 체중(kg) ÷ 신장(m)²
 * 신장을 cm로 받아 m로 변환한다.
 */
export function calcBmi(heightCm: number, weightKg: number): BmiResult {
  const empty: BmiResult = {
    valid: false,
    bmi: 0,
    category: BMI_CATEGORIES[0]!,
    normalWeightMin: 0,
    normalWeightMax: 0,
    weightToLose: 0,
    standardWeight: 0,
  }

  if (heightCm <= 0 || weightKg <= 0) return empty

  const heightM = heightCm / 100
  const heightSquared = heightM * heightM
  const bmi = round(weightKg / heightSquared, 2)

  const normalWeightMin = round(18.5 * heightSquared, 1)
  const normalWeightMax = round(23 * heightSquared, 1)
  const standardWeight = round(22 * heightSquared, 1)

  // 정상 범위 안이면 조절할 체중이 없다
  let weightToLose = 0
  if (weightKg > normalWeightMax) weightToLose = round(weightKg - normalWeightMax, 1)
  else if (weightKg < normalWeightMin) weightToLose = round(weightKg - normalWeightMin, 1)

  return {
    valid: true,
    bmi,
    category: classifyBmi(bmi),
    normalWeightMin,
    normalWeightMax,
    weightToLose,
    standardWeight,
  }
}
