import { round } from '@/utils/number'

export interface FormulaInput {
  key: string
  label: string
  /** 기본값 */
  value: number
  suffix?: string
}

export interface Formula {
  id: string
  group: string
  title: string
  /** 사람이 읽는 수식 */
  expression: string
  inputs: FormulaInput[]
  /** 검색용 키워드 */
  keywords: string[]
  /** 입력값 맵을 받아 결과를 계산한다 */
  compute: (v: Record<string, number>) => number
  resultLabel: string
  resultSuffix?: string
  note?: string
}

const PI = Math.PI

/**
 * 공식 모음.
 *
 * '공식을 찾아보고 바로 값을 넣어보는' 흐름이 목적이라, 설명과 계산을 한 항목에 묶었다.
 * 새 공식은 이 배열에 항목만 추가하면 검색·계산에 모두 반영된다.
 */
export const FORMULAS: Formula[] = [
  // ── 평면도형 ──
  {
    id: 'circle-area',
    group: '평면도형',
    title: '원의 면적',
    expression: 'S = π r²',
    inputs: [{ key: 'r', label: '반지름 (r)', value: 5 }],
    keywords: ['원', '면적', '원면적', '반지름', 'circle', 'area'],
    compute: (v) => PI * (v.r ?? 0) ** 2,
    resultLabel: '면적',
  },
  {
    id: 'circle-circumference',
    group: '평면도형',
    title: '원의 둘레',
    expression: 'L = 2 π r',
    inputs: [{ key: 'r', label: '반지름 (r)', value: 5 }],
    keywords: ['원', '둘레', '원주', 'circle', 'circumference'],
    compute: (v) => 2 * PI * (v.r ?? 0),
    resultLabel: '둘레',
  },
  {
    id: 'triangle-area',
    group: '평면도형',
    title: '삼각형의 면적',
    expression: 'S = 밑변 × 높이 ÷ 2',
    inputs: [
      { key: 'b', label: '밑변', value: 10 },
      { key: 'h', label: '높이', value: 6 },
    ],
    keywords: ['삼각형', '면적', 'triangle', 'area'],
    compute: (v) => ((v.b ?? 0) * (v.h ?? 0)) / 2,
    resultLabel: '면적',
  },
  {
    id: 'trapezoid-area',
    group: '평면도형',
    title: '사다리꼴의 면적',
    expression: 'S = (윗변 + 아랫변) × 높이 ÷ 2',
    inputs: [
      { key: 'a', label: '윗변', value: 4 },
      { key: 'b', label: '아랫변', value: 8 },
      { key: 'h', label: '높이', value: 5 },
    ],
    keywords: ['사다리꼴', '면적', 'trapezoid'],
    compute: (v) => (((v.a ?? 0) + (v.b ?? 0)) * (v.h ?? 0)) / 2,
    resultLabel: '면적',
  },
  {
    id: 'pythagorean',
    group: '평면도형',
    title: '피타고라스의 정리 (빗변)',
    expression: 'c = √(a² + b²)',
    inputs: [
      { key: 'a', label: '변 a', value: 3 },
      { key: 'b', label: '변 b', value: 4 },
    ],
    keywords: ['피타고라스', '빗변', '직각삼각형', 'pythagorean', 'hypotenuse'],
    compute: (v) => Math.sqrt((v.a ?? 0) ** 2 + (v.b ?? 0) ** 2),
    resultLabel: '빗변 c',
  },

  // ── 입체도형 ──
  {
    id: 'sphere-volume',
    group: '입체도형',
    title: '구의 부피',
    expression: 'V = (4/3) π r³',
    inputs: [{ key: 'r', label: '반지름 (r)', value: 5 }],
    keywords: ['구', '부피', '공', 'sphere', 'volume'],
    compute: (v) => (4 / 3) * PI * (v.r ?? 0) ** 3,
    resultLabel: '부피',
  },
  {
    id: 'sphere-area',
    group: '입체도형',
    title: '구의 표면적',
    expression: 'S = 4 π r²',
    inputs: [{ key: 'r', label: '반지름 (r)', value: 5 }],
    keywords: ['구', '표면적', 'sphere', 'surface'],
    compute: (v) => 4 * PI * (v.r ?? 0) ** 2,
    resultLabel: '표면적',
  },
  {
    id: 'cylinder-volume',
    group: '입체도형',
    title: '원기둥의 부피',
    expression: 'V = π r² h',
    inputs: [
      { key: 'r', label: '반지름 (r)', value: 3 },
      { key: 'h', label: '높이 (h)', value: 10 },
    ],
    keywords: ['원기둥', '부피', '실린더', 'cylinder', 'volume'],
    compute: (v) => PI * (v.r ?? 0) ** 2 * (v.h ?? 0),
    resultLabel: '부피',
  },
  {
    id: 'cone-volume',
    group: '입체도형',
    title: '원뿔의 부피',
    expression: 'V = (1/3) π r² h',
    inputs: [
      { key: 'r', label: '반지름 (r)', value: 3 },
      { key: 'h', label: '높이 (h)', value: 10 },
    ],
    keywords: ['원뿔', '부피', 'cone', 'volume'],
    compute: (v) => (1 / 3) * PI * (v.r ?? 0) ** 2 * (v.h ?? 0),
    resultLabel: '부피',
  },
  {
    id: 'box-volume',
    group: '입체도형',
    title: '직육면체의 부피',
    expression: 'V = 가로 × 세로 × 높이',
    inputs: [
      { key: 'w', label: '가로', value: 10 },
      { key: 'd', label: '세로', value: 20 },
      { key: 'h', label: '높이', value: 30 },
    ],
    keywords: ['직육면체', '부피', '박스', '상자', 'box', 'volume', '택배'],
    compute: (v) => (v.w ?? 0) * (v.d ?? 0) * (v.h ?? 0),
    resultLabel: '부피',
  },

  // ── 방정식 ──
  {
    id: 'quadratic-discriminant',
    group: '방정식',
    title: '이차방정식 판별식',
    expression: 'D = b² − 4ac',
    inputs: [
      { key: 'a', label: 'a', value: 1 },
      { key: 'b', label: 'b', value: -3 },
      { key: 'c', label: 'c', value: 2 },
    ],
    keywords: ['이차방정식', '판별식', '근', 'quadratic', 'discriminant'],
    compute: (v) => (v.b ?? 0) ** 2 - 4 * (v.a ?? 0) * (v.c ?? 0),
    resultLabel: '판별식 D',
    note: 'D > 0 서로 다른 두 실근 / D = 0 중근 / D < 0 서로 다른 두 허근',
  },
  {
    id: 'quadratic-root1',
    group: '방정식',
    title: '이차방정식의 근 (근의 공식, +)',
    expression: 'x = (−b + √(b² − 4ac)) ÷ 2a',
    inputs: [
      { key: 'a', label: 'a', value: 1 },
      { key: 'b', label: 'b', value: -3 },
      { key: 'c', label: 'c', value: 2 },
    ],
    keywords: ['이차방정식', '근의공식', '해', 'quadratic', 'root'],
    compute: (v) => {
      const a = v.a ?? 0
      const b = v.b ?? 0
      const c = v.c ?? 0
      if (a === 0) return NaN
      const d = b ** 2 - 4 * a * c
      if (d < 0) return NaN
      return (-b + Math.sqrt(d)) / (2 * a)
    },
    resultLabel: '근 x₁',
    note: 'a = 0 이거나 판별식이 음수면 실근이 없습니다',
  },

  // ── 비율·통계 ──
  {
    id: 'average',
    group: '비율 · 통계',
    title: '두 수의 평균',
    expression: 'M = (a + b) ÷ 2',
    inputs: [
      { key: 'a', label: 'a', value: 80 },
      { key: 'b', label: 'b', value: 90 },
    ],
    keywords: ['평균', '산술평균', 'average', 'mean'],
    compute: (v) => ((v.a ?? 0) + (v.b ?? 0)) / 2,
    resultLabel: '평균',
  },
  {
    id: 'speed',
    group: '비율 · 통계',
    title: '속력',
    expression: 'v = 거리 ÷ 시간',
    inputs: [
      { key: 'd', label: '거리 (km)', value: 120 },
      { key: 't', label: '시간 (h)', value: 2 },
    ],
    keywords: ['속력', '속도', '거리', '시간', 'speed', 'velocity'],
    compute: (v) => ((v.t ?? 0) === 0 ? NaN : (v.d ?? 0) / (v.t ?? 1)),
    resultLabel: '속력 (km/h)',
  },
  {
    id: 'circle-from-area',
    group: '비율 · 통계',
    title: '면적으로 원의 반지름 구하기',
    expression: 'r = √(S ÷ π)',
    inputs: [{ key: 's', label: '면적 (S)', value: 78.54 }],
    keywords: ['원', '반지름', '역산', 'radius', 'area'],
    compute: (v) => Math.sqrt((v.s ?? 0) / PI),
    resultLabel: '반지름 r',
  },
]

/** 공식 검색. 제목·수식·키워드·그룹을 대상으로 부분 문자열 매칭 */
export function searchFormulas(query: string): Formula[] {
  const q = query.trim().toLowerCase()
  if (!q) return FORMULAS

  return FORMULAS.filter((f) => {
    const haystack = [f.title, f.expression, f.group, ...f.keywords].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}

/** 공식 계산. NaN/Infinity 는 null 로 바꿔 화면에 노출되지 않게 한다 */
export function computeFormula(formula: Formula, values: Record<string, number>): number | null {
  const result = formula.compute(values)
  if (!Number.isFinite(result)) return null
  return round(result, 6)
}

export const FORMULA_GROUPS = [...new Set(FORMULAS.map((f) => f.group))]
