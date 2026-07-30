/**
 * 퍼센트 계산은 "무엇을 구하려는가"에 따라 식이 완전히 달라진다.
 * 하나의 입력 폼에 억지로 담으면 오히려 헷갈리므로 4가지 모드로 분리한다.
 */
export type PercentMode =
  /** A의 B%는? */
  | 'of'
  /** A는 B의 몇 %? */
  | 'ratio'
  /** A에서 B로 변할 때 증감률은? */
  | 'change'
  /** A에서 B% 증가/감소하면? */
  | 'apply'

export interface PercentResult {
  value: number
  /** 화면에 보여줄 계산 과정 */
  formula: string
  /** 결과값의 단위 성격 ('%' 또는 '') */
  unit: string
}

export function percentOf(a: number, b: number): PercentResult {
  return {
    value: (a * b) / 100,
    formula: `${a} × ${b} ÷ 100`,
    unit: '',
  }
}

export function percentRatio(a: number, b: number): PercentResult {
  return {
    value: b === 0 ? 0 : (a / b) * 100,
    formula: b === 0 ? '기준값이 0이면 비율을 구할 수 없습니다' : `${a} ÷ ${b} × 100`,
    unit: '%',
  }
}

export function percentChange(from: number, to: number): PercentResult {
  return {
    value: from === 0 ? 0 : ((to - from) / from) * 100,
    formula:
      from === 0 ? '기준값이 0이면 증감률을 구할 수 없습니다' : `(${to} − ${from}) ÷ ${from} × 100`,
    unit: '%',
  }
}

export function percentApply(base: number, ratePct: number): PercentResult {
  return {
    value: base * (1 + ratePct / 100),
    formula: `${base} × (1 ${ratePct >= 0 ? '+' : '−'} ${Math.abs(ratePct)} ÷ 100)`,
    unit: '',
  }
}

export function calcPercent(mode: PercentMode, a: number, b: number): PercentResult {
  switch (mode) {
    case 'of':
      return percentOf(a, b)
    case 'ratio':
      return percentRatio(a, b)
    case 'change':
      return percentChange(a, b)
    case 'apply':
      return percentApply(a, b)
  }
}

export const MODE_LABELS: Record<PercentMode, string> = {
  of: 'A의 B% 는?',
  ratio: 'A는 B의 몇 % 인가?',
  change: 'A에서 B로 변하면 몇 % 증감?',
  apply: 'A에서 B% 증가/감소하면?',
}

export const MODE_FIELD_LABELS: Record<PercentMode, { a: string; b: string; result: string }> = {
  of: { a: '기준값 (A)', b: '비율 (B)', result: 'A의 B%' },
  ratio: { a: '부분값 (A)', b: '전체값 (B)', result: '비율' },
  change: { a: '변경 전 (A)', b: '변경 후 (B)', result: '증감률' },
  apply: { a: '기준값 (A)', b: '증감률 (B)', result: '적용 결과' },
}
