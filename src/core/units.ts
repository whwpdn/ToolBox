/**
 * 단위 변환 계수 테이블.
 *
 * 각 단위는 '기준 단위 1개에 대한 배율'로 정의한다.
 * 변환은 (값 × from.factor) ÷ to.factor 로 계산되므로 단위를 추가할 때
 * 다른 단위를 건드릴 필요가 없다.
 *
 * 온도처럼 배율만으로 표현되지 않는(원점이 다른) 단위는 여기 넣지 않고
 * 해당 도구에서 함수로 변환한다.
 */
export interface UnitDef {
  code: string
  label: string
  /** 기준 단위 1에 대한 배율 */
  factor: number
}

/** 기준: 미터 */
export const LENGTH_UNITS: UnitDef[] = [
  { code: 'mm', label: '밀리미터 (mm)', factor: 0.001 },
  { code: 'cm', label: '센티미터 (cm)', factor: 0.01 },
  { code: 'm', label: '미터 (m)', factor: 1 },
  { code: 'km', label: '킬로미터 (km)', factor: 1000 },
  { code: 'in', label: '인치 (in)', factor: 0.0254 },
  { code: 'ft', label: '피트 (ft)', factor: 0.3048 },
  { code: 'yd', label: '야드 (yd)', factor: 0.9144 },
  { code: 'mi', label: '마일 (mi)', factor: 1609.344 },
  { code: 'ja', label: '자 (척)', factor: 10 / 33 },
  { code: 'nmi', label: '해리 (nmi)', factor: 1852 },
]

/** 기준: 킬로그램 */
export const WEIGHT_UNITS: UnitDef[] = [
  { code: 'mg', label: '밀리그램 (mg)', factor: 0.000001 },
  { code: 'g', label: '그램 (g)', factor: 0.001 },
  { code: 'kg', label: '킬로그램 (kg)', factor: 1 },
  { code: 't', label: '톤 (t)', factor: 1000 },
  { code: 'oz', label: '온스 (oz)', factor: 0.028349523125 },
  { code: 'lb', label: '파운드 (lb)', factor: 0.45359237 },
  { code: 'geun', label: '근 (600g)', factor: 0.6 },
  { code: 'don', label: '돈 (3.75g)', factor: 0.00375 },
  { code: 'gwan', label: '관 (3.75kg)', factor: 3.75 },
]

/** 기준: 제곱미터 */
export const AREA_UNITS: UnitDef[] = [
  { code: 'cm2', label: '제곱센티미터 (㎠)', factor: 0.0001 },
  { code: 'm2', label: '제곱미터 (㎡)', factor: 1 },
  { code: 'pyeong', label: '평', factor: 400 / 121 },
  { code: 'km2', label: '제곱킬로미터 (㎢)', factor: 1_000_000 },
  { code: 'ha', label: '헥타르 (ha)', factor: 10_000 },
  { code: 'are', label: '아르 (a)', factor: 100 },
  { code: 'acre', label: '에이커 (acre)', factor: 4046.8564224 },
  { code: 'ft2', label: '제곱피트 (ft²)', factor: 0.09290304 },
  { code: 'danbo', label: '단보 (300평)', factor: (400 / 121) * 300 },
  { code: 'jeongbo', label: '정보 (3000평)', factor: (400 / 121) * 3000 },
]

/** 기준: 리터 */
export const VOLUME_UNITS: UnitDef[] = [
  { code: 'ml', label: '밀리리터 (mL)', factor: 0.001 },
  { code: 'l', label: '리터 (L)', factor: 1 },
  { code: 'cm3', label: '세제곱센티미터 (㎤)', factor: 0.001 },
  { code: 'm3', label: '세제곱미터 (㎥)', factor: 1000 },
  { code: 'cup', label: '컵 (200mL)', factor: 0.2 },
  { code: 'galUS', label: '갤런 (US)', factor: 3.785411784 },
  { code: 'galUK', label: '갤런 (UK)', factor: 4.54609 },
  { code: 'ozUS', label: '액량온스 (US fl oz)', factor: 0.0295735295625 },
  { code: 'doe', label: '되 (1.8L)', factor: 1.8039 },
]

/**
 * 배율 기반 단위 변환.
 * 알 수 없는 단위 코드가 들어오면 0을 돌려준다(화면에 NaN을 노출하지 않기 위해).
 */
export function convert(value: number, from: string, to: string, units: UnitDef[]): number {
  if (!Number.isFinite(value)) return 0
  const f = units.find((u) => u.code === from)
  const t = units.find((u) => u.code === to)
  if (!f || !t || t.factor === 0) return 0
  return (value * f.factor) / t.factor
}

/** 단위 목록을 SelectField 옵션으로 */
export function unitOptions(units: UnitDef[]) {
  return units.map((u) => ({ value: u.code, label: u.label }))
}
