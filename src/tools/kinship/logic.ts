/**
 * 호칭(촌수) 계산기.
 *
 * '나의 ㅇㅇ의 ㅇㅇ' 처럼 관계를 이어 붙이면 그 사람을 뭐라고 부르는지 알려준다.
 *
 * 조합이 폭발하므로 모든 경우를 규칙으로 유도하지 않는다. 실제로 쓰이는 호칭은
 * 관습에 따라 정해져 있어서(예: 아버지의 형은 '큰아버지') 규칙보다 사전이 정확하다.
 * 대신 촌수는 규칙으로 계산해 사전에 없는 조합에서도 의미 있는 답을 준다.
 */

export type Gender = 'male' | 'female'

/** 관계를 잇는 최소 단위 */
export type Step =
  | 'father'
  | 'mother'
  | 'husband'
  | 'wife'
  | 'elderBrother'
  | 'elderSister'
  | 'youngerBrother'
  | 'youngerSister'
  | 'son'
  | 'daughter'

export interface StepDef {
  step: Step
  /** 화자 성별에 따라 부르는 말이 달라지는 관계가 있다 (형/오빠, 누나/언니) */
  label: (gender: Gender) => string
  /** 촌수. 부모·자식 1촌, 형제 2촌, 배우자 0촌(무촌) */
  degree: number
  /** 화자가 이 성별일 때만 고를 수 있다 (남편/아내) */
  onlyFor?: Gender
}

export const STEPS: StepDef[] = [
  { step: 'father', label: () => '아버지', degree: 1 },
  { step: 'mother', label: () => '어머니', degree: 1 },
  { step: 'husband', label: () => '남편', degree: 0, onlyFor: 'female' },
  { step: 'wife', label: () => '아내', degree: 0, onlyFor: 'male' },
  { step: 'elderBrother', label: (g) => (g === 'male' ? '형' : '오빠'), degree: 2 },
  { step: 'elderSister', label: (g) => (g === 'male' ? '누나' : '언니'), degree: 2 },
  { step: 'youngerBrother', label: () => '남동생', degree: 2 },
  { step: 'youngerSister', label: () => '여동생', degree: 2 },
  { step: 'son', label: () => '아들', degree: 1 },
  { step: 'daughter', label: () => '딸', degree: 1 },
]

const STEP_BY_ID = new Map(STEPS.map((s) => [s.step, s]))

/**
 * 해당 위치에서 고를 수 있는 관계.
 *
 * 배우자 제약(남편/아내)은 **첫 단계에만** 적용된다. 첫 단계의 배우자는 '나의 배우자'라
 * 내 성별이 정하지만, 두 번째부터는 앞사람의 배우자다.
 * 여자도 '나의 오빠의 아내'(새언니)를 고를 수 있어야 한다.
 */
export function availableStepsAt(gender: Gender, index: number): StepDef[] {
  if (index > 0) return STEPS
  return STEPS.filter((s) => !s.onlyFor || s.onlyFor === gender)
}

/** 첫 단계 기준 (하위 호환) */
export function availableSteps(gender: Gender): StepDef[] {
  return availableStepsAt(gender, 0)
}

/**
 * 성별을 바꿨을 때 경로를 보정한다.
 * 첫 단계가 내 성별로 고를 수 없는 배우자면 반대쪽으로 바꾼다. 나머지는 건드리지 않는다.
 */
export function fixChainForGender(steps: Step[], gender: Gender): Step[] {
  const first = steps[0]
  if (!first) return steps
  if (gender === 'male' && first === 'husband') return ['wife', ...steps.slice(1)]
  if (gender === 'female' && first === 'wife') return ['husband', ...steps.slice(1)]
  return steps
}

interface Term {
  /** 대표 호칭 */
  term: string
  /** 같은 뜻으로 쓰이는 다른 호칭 */
  alt?: string
  note?: string
  /** 남/여 화자에 따라 호칭이 다른 경우 */
  byGender?: Partial<Record<Gender, { term: string; alt?: string; note?: string }>>
}

/**
 * 호칭 사전. 키는 관계를 '/'로 이은 경로다.
 *
 * 실제로 쓰이는 호칭만 담았다. 지역·집안마다 다른 경우 alt에 병기한다.
 */
const TERMS: Record<string, Term> = {
  // ── 1단계 ──
  father: { term: '아버지', alt: '아빠' },
  mother: { term: '어머니', alt: '엄마' },
  husband: { term: '남편' },
  wife: { term: '아내', alt: '집사람' },
  elderBrother: { term: '형', byGender: { female: { term: '오빠' } } },
  elderSister: { term: '누나', byGender: { female: { term: '언니' } } },
  youngerBrother: { term: '남동생' },
  youngerSister: { term: '여동생' },
  son: { term: '아들' },
  daughter: { term: '딸' },

  // ── 조부모 ──
  'father/father': { term: '할아버지', alt: '친할아버지' },
  'father/mother': { term: '할머니', alt: '친할머니' },
  'mother/father': { term: '외할아버지' },
  'mother/mother': { term: '외할머니' },
  'father/father/father': { term: '증조할아버지', alt: '증조부' },
  'father/father/mother': { term: '증조할머니', alt: '증조모' },
  'mother/mother/mother': { term: '외증조할머니' },
  'mother/father/father': { term: '외증조할아버지' },

  // ── 아버지 쪽 ──
  'father/elderBrother': { term: '큰아버지', alt: '백부' },
  'father/youngerBrother': { term: '작은아버지', alt: '삼촌 · 숙부' },
  'father/elderSister': { term: '고모' },
  'father/youngerSister': { term: '고모' },
  'father/son': { term: '형제', note: '나 자신 또는 형·남동생' },
  'father/daughter': { term: '자매', note: '나 자신 또는 누나·여동생' },

  // ── 어머니 쪽 ──
  'mother/elderBrother': { term: '외삼촌', alt: '외숙부' },
  'mother/youngerBrother': { term: '외삼촌', alt: '외숙부' },
  'mother/elderSister': { term: '이모' },
  'mother/youngerSister': { term: '이모' },

  // ── 큰아버지·고모 등의 배우자 ──
  'father/elderBrother/wife': { term: '큰어머니', alt: '백모' },
  'father/youngerBrother/wife': { term: '작은어머니', alt: '숙모' },
  'father/elderSister/husband': { term: '고모부' },
  'father/youngerSister/husband': { term: '고모부' },
  'mother/elderBrother/wife': { term: '외숙모' },
  'mother/youngerBrother/wife': { term: '외숙모' },
  'mother/elderSister/husband': { term: '이모부' },
  'mother/youngerSister/husband': { term: '이모부' },

  // ── 사촌 ──
  'father/elderBrother/son': {
    term: '사촌 형제',
    alt: '종형제',
    note: '나이에 따라 사촌 형·사촌 동생',
  },
  'father/youngerBrother/son': { term: '사촌 형제', alt: '종형제' },
  'father/elderBrother/daughter': { term: '사촌 자매', alt: '종자매' },
  'father/youngerBrother/daughter': { term: '사촌 자매', alt: '종자매' },
  'father/elderSister/son': { term: '고종사촌', note: '고모의 아들' },
  'father/youngerSister/son': { term: '고종사촌' },
  'father/elderSister/daughter': { term: '고종사촌' },
  'father/youngerSister/daughter': { term: '고종사촌' },
  'mother/elderBrother/son': { term: '외사촌', note: '외삼촌의 아들' },
  'mother/youngerBrother/son': { term: '외사촌' },
  'mother/elderBrother/daughter': { term: '외사촌' },
  'mother/youngerBrother/daughter': { term: '외사촌' },
  'mother/elderSister/son': { term: '이종사촌', note: '이모의 아들' },
  'mother/youngerSister/son': { term: '이종사촌' },
  'mother/elderSister/daughter': { term: '이종사촌' },
  'mother/youngerSister/daughter': { term: '이종사촌' },

  // ── 형제자매의 배우자 ──
  'elderBrother/wife': {
    term: '형수님',
    byGender: { female: { term: '새언니', alt: '올케' } },
  },
  'youngerBrother/wife': {
    term: '제수씨',
    byGender: { female: { term: '올케' } },
  },
  'elderSister/husband': {
    term: '매형',
    alt: '자형',
    byGender: { female: { term: '형부' } },
  },
  'youngerSister/husband': {
    term: '매제',
    byGender: { female: { term: '제부' } },
  },

  // ── 형제자매의 자녀 (조카) ──
  'elderBrother/son': { term: '조카' },
  'elderBrother/daughter': { term: '조카딸', alt: '질녀' },
  'youngerBrother/son': { term: '조카' },
  'youngerBrother/daughter': { term: '조카딸', alt: '질녀' },
  'elderSister/son': { term: '조카', note: '누나·언니의 아들' },
  'elderSister/daughter': { term: '조카딸' },
  'youngerSister/son': { term: '조카' },
  'youngerSister/daughter': { term: '조카딸' },

  // ── 자녀·손주 ──
  'son/son': { term: '손자' },
  'son/daughter': { term: '손녀' },
  'daughter/son': { term: '외손자' },
  'daughter/daughter': { term: '외손녀' },
  'son/wife': { term: '며느리' },
  'daughter/husband': { term: '사위' },
  'son/son/son': { term: '증손자' },
  'son/son/daughter': { term: '증손녀' },

  // ── 시댁 (아내 → 남편의 가족) ──
  'husband/father': { term: '시아버지', alt: '아버님' },
  'husband/mother': { term: '시어머니', alt: '어머님' },
  'husband/elderBrother': { term: '아주버님' },
  'husband/youngerBrother': {
    term: '도련님',
    alt: '서방님',
    note: '결혼 전 도련님, 결혼 후 서방님',
  },
  'husband/elderSister': { term: '형님' },
  'husband/youngerSister': { term: '아가씨' },
  'husband/elderBrother/wife': { term: '형님' },
  'husband/youngerBrother/wife': { term: '동서' },

  // ── 처가 (남편 → 아내의 가족) ──
  'wife/father': { term: '장인어른', alt: '장인' },
  'wife/mother': { term: '장모님', alt: '장모' },
  'wife/elderBrother': { term: '형님', note: '손위 처남' },
  'wife/youngerBrother': { term: '처남' },
  'wife/elderSister': { term: '처형' },
  'wife/youngerSister': { term: '처제' },
  'wife/elderSister/husband': { term: '형님', note: '손위 동서' },
  'wife/youngerSister/husband': { term: '동서' },

  // ── 조부모의 형제 ──
  'father/father/elderBrother': { term: '큰할아버지', alt: '종조부' },
  'father/father/youngerBrother': { term: '작은할아버지', alt: '종조부' },
  'father/father/elderSister': { term: '대고모', alt: '왕고모' },
  'father/father/youngerSister': { term: '대고모', alt: '왕고모' },
}

export interface KinshipResult {
  /** 유효한 경로인지 (빈 경로면 false) */
  valid: boolean
  /** 사전에서 찾은 호칭. 못 찾으면 null */
  term: string | null
  alt: string | null
  note: string | null
  /** '나의 아버지의 아버지' 형태의 설명 */
  path: string
  /** 촌수. 배우자가 끼면 혈족이 아니므로 null */
  degree: number | null
  /** 촌수를 계산할 수 없는 이유 */
  degreeNote: string | null
}

/** 경로를 사람이 읽는 문장으로 */
export function describePath(steps: Step[], gender: Gender): string {
  if (steps.length === 0) return '나'
  return `나의 ${steps.map((s) => STEP_BY_ID.get(s)?.label(gender) ?? s).join('의 ')}`
}

/**
 * 촌수 계산.
 * 부모·자식 1촌, 형제 2촌을 더해 나간다. 배우자는 무촌이라 혈족 촌수를 매길 수 없다.
 */
export function calcDegree(steps: Step[]): { degree: number | null; note: string | null } {
  const hasSpouse = steps.some((s) => s === 'husband' || s === 'wife')
  if (hasSpouse) {
    return { degree: null, note: '배우자는 무촌(０촌)이라 혈족 촌수로 세지 않습니다' }
  }
  const degree = steps.reduce((sum, s) => sum + (STEP_BY_ID.get(s)?.degree ?? 0), 0)
  return { degree, note: null }
}

export function resolveKinship(steps: Step[], gender: Gender): KinshipResult {
  const path = describePath(steps, gender)
  const { degree, note: degreeNote } = calcDegree(steps)

  if (steps.length === 0) {
    return { valid: false, term: null, alt: null, note: null, path, degree: 0, degreeNote: null }
  }

  const entry = TERMS[steps.join('/')]
  if (!entry) {
    return { valid: true, term: null, alt: null, note: null, path, degree, degreeNote }
  }

  // 화자 성별에 따라 호칭이 다른 경우 덮어쓴다
  const override = entry.byGender?.[gender]
  return {
    valid: true,
    term: override?.term ?? entry.term,
    alt: override?.alt ?? (override ? null : (entry.alt ?? null)),
    note: override?.note ?? (override ? null : (entry.note ?? null)),
    path,
    degree,
    degreeNote,
  }
}

/** 사전에 등록된 호칭 개수 (문서·화면 표기용) */
export const TERM_COUNT = Object.keys(TERMS).length

/** 자주 찾는 조합 — 화면의 예시 버튼용 */
export const EXAMPLES: Array<{ label: string; steps: Step[] }> = [
  { label: '할아버지', steps: ['father', 'father'] },
  { label: '큰아버지', steps: ['father', 'elderBrother'] },
  { label: '이모', steps: ['mother', 'elderSister'] },
  { label: '외사촌', steps: ['mother', 'elderBrother', 'son'] },
  { label: '처제', steps: ['wife', 'youngerSister'] },
  { label: '형수님', steps: ['elderBrother', 'wife'] },
]
