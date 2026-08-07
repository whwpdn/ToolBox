import { describe, expect, it } from 'vitest'
import {
  EXAMPLES,
  availableSteps,
  availableStepsAt,
  calcDegree,
  describePath,
  fixChainForGender,
  resolveKinship,
  type Step,
} from './logic'

const male = (steps: Step[]) => resolveKinship(steps, 'male')
const female = (steps: Step[]) => resolveKinship(steps, 'female')

describe('availableSteps · 첫 단계', () => {
  it('남자는 아내를, 여자는 남편을 고를 수 있다', () => {
    const m = availableSteps('male').map((s) => s.step)
    expect(m).toContain('wife')
    expect(m).not.toContain('husband')

    const f = availableSteps('female').map((s) => s.step)
    expect(f).toContain('husband')
    expect(f).not.toContain('wife')
  })
})

describe('availableStepsAt · 두 번째 이후 단계', () => {
  it('배우자 제약은 첫 단계에만 적용된다', () => {
    // '나의 오빠의 아내'(새언니)는 여자도 고를 수 있어야 한다
    const second = availableStepsAt('female', 1).map((s) => s.step)
    expect(second).toContain('wife')
    expect(second).toContain('husband')

    const secondMale = availableStepsAt('male', 1).map((s) => s.step)
    expect(secondMale).toContain('husband')
  })

  it('첫 단계는 여전히 제한된다', () => {
    expect(availableStepsAt('female', 0).map((s) => s.step)).not.toContain('wife')
  })
})

describe('fixChainForGender · 성별 전환 보정', () => {
  it('첫 단계의 배우자만 반대쪽으로 바꾼다', () => {
    expect(fixChainForGender(['wife', 'father'], 'female')).toEqual(['husband', 'father'])
    expect(fixChainForGender(['husband', 'mother'], 'male')).toEqual(['wife', 'mother'])
  })

  it('두 번째 이후의 배우자는 건드리지 않는다 (앞사람의 배우자이므로)', () => {
    // 남자의 '형의 아내'(형수님)를 여자로 바꾸면 '오빠의 아내'(새언니)가 되어야 한다
    expect(fixChainForGender(['elderBrother', 'wife'], 'female')).toEqual(['elderBrother', 'wife'])
    expect(fixChainForGender(['elderSister', 'husband'], 'male')).toEqual([
      'elderSister',
      'husband',
    ])
  })

  it('바꿀 필요가 없으면 그대로 둔다', () => {
    expect(fixChainForGender(['father', 'father'], 'male')).toEqual(['father', 'father'])
    expect(fixChainForGender([], 'male')).toEqual([])
  })
})

describe('describePath · 화자 성별에 따른 라벨', () => {
  it('형/오빠, 누나/언니를 구분한다', () => {
    expect(describePath(['elderBrother'], 'male')).toBe('나의 형')
    expect(describePath(['elderBrother'], 'female')).toBe('나의 오빠')
    expect(describePath(['elderSister'], 'male')).toBe('나의 누나')
    expect(describePath(['elderSister'], 'female')).toBe('나의 언니')
  })

  it('여러 단계를 이어 붙인다', () => {
    expect(describePath(['father', 'father'], 'male')).toBe('나의 아버지의 아버지')
    expect(describePath(['mother', 'elderBrother', 'son'], 'female')).toBe(
      '나의 어머니의 오빠의 아들',
    )
  })

  it('빈 경로는 나 자신', () => {
    expect(describePath([], 'male')).toBe('나')
  })
})

describe('calcDegree · 촌수', () => {
  it('부모·자식은 1촌', () => {
    expect(calcDegree(['father']).degree).toBe(1)
    expect(calcDegree(['son']).degree).toBe(1)
  })

  it('형제는 2촌', () => {
    expect(calcDegree(['elderBrother']).degree).toBe(2)
    expect(calcDegree(['youngerSister']).degree).toBe(2)
  })

  it('할아버지는 2촌', () => {
    expect(calcDegree(['father', 'father']).degree).toBe(2)
  })

  it('큰아버지·고모는 3촌', () => {
    expect(calcDegree(['father', 'elderBrother']).degree).toBe(3)
    expect(calcDegree(['father', 'youngerSister']).degree).toBe(3)
  })

  it('사촌은 4촌', () => {
    expect(calcDegree(['father', 'elderBrother', 'son']).degree).toBe(4)
    expect(calcDegree(['mother', 'elderSister', 'daughter']).degree).toBe(4)
  })

  it('조카는 3촌', () => {
    expect(calcDegree(['elderBrother', 'son']).degree).toBe(3)
  })

  it('배우자가 끼면 촌수를 매기지 않는다 (무촌)', () => {
    const r = calcDegree(['wife'])
    expect(r.degree).toBeNull()
    expect(r.note).toContain('무촌')
    expect(calcDegree(['husband', 'father']).degree).toBeNull()
    expect(calcDegree(['elderBrother', 'wife']).degree).toBeNull()
  })
})

describe('resolveKinship · 직계', () => {
  it('할아버지 · 할머니', () => {
    expect(male(['father', 'father']).term).toBe('할아버지')
    expect(male(['father', 'mother']).term).toBe('할머니')
    expect(male(['mother', 'father']).term).toBe('외할아버지')
    expect(male(['mother', 'mother']).term).toBe('외할머니')
  })

  it('증조부모', () => {
    expect(male(['father', 'father', 'father']).term).toBe('증조할아버지')
  })

  it('손주는 아들 쪽과 딸 쪽을 구분한다', () => {
    expect(male(['son', 'son']).term).toBe('손자')
    expect(male(['daughter', 'son']).term).toBe('외손자')
    expect(male(['daughter', 'daughter']).term).toBe('외손녀')
  })
})

describe('resolveKinship · 아버지 쪽 / 어머니 쪽', () => {
  it('아버지의 형은 큰아버지, 남동생은 작은아버지', () => {
    expect(male(['father', 'elderBrother']).term).toBe('큰아버지')
    expect(male(['father', 'youngerBrother']).term).toBe('작은아버지')
  })

  it('아버지의 자매는 나이와 무관하게 고모', () => {
    expect(male(['father', 'elderSister']).term).toBe('고모')
    expect(male(['father', 'youngerSister']).term).toBe('고모')
  })

  it('어머니의 형제는 외삼촌, 자매는 이모', () => {
    expect(male(['mother', 'elderBrother']).term).toBe('외삼촌')
    expect(male(['mother', 'youngerBrother']).term).toBe('외삼촌')
    expect(male(['mother', 'elderSister']).term).toBe('이모')
  })

  it('사촌의 종류를 구분한다', () => {
    expect(male(['father', 'elderBrother', 'son']).term).toBe('사촌 형제')
    expect(male(['father', 'elderSister', 'son']).term).toBe('고종사촌')
    expect(male(['mother', 'elderBrother', 'son']).term).toBe('외사촌')
    expect(male(['mother', 'elderSister', 'son']).term).toBe('이종사촌')
  })
})

describe('resolveKinship · 화자 성별에 따라 달라지는 호칭', () => {
  it('형의 아내: 남자는 형수님, 여자는 새언니', () => {
    expect(male(['elderBrother', 'wife']).term).toBe('형수님')
    expect(female(['elderBrother', 'wife']).term).toBe('새언니')
  })

  it('누나/언니의 남편: 남자는 매형, 여자는 형부', () => {
    expect(male(['elderSister', 'husband']).term).toBe('매형')
    expect(female(['elderSister', 'husband']).term).toBe('형부')
  })

  it('여동생의 남편: 남자는 매제, 여자는 제부', () => {
    expect(male(['youngerSister', 'husband']).term).toBe('매제')
    expect(female(['youngerSister', 'husband']).term).toBe('제부')
  })

  it('성별 분기가 있으면 기본 alt를 끌고 오지 않는다', () => {
    // 매형의 alt는 '자형'이지만 여자 화자(형부)에게는 해당하지 않는다
    expect(male(['elderSister', 'husband']).alt).toBe('자형')
    expect(female(['elderSister', 'husband']).alt).toBeNull()
  })

  it('형/오빠 같은 1단계 호칭도 성별을 반영한다', () => {
    expect(male(['elderBrother']).term).toBe('형')
    expect(female(['elderBrother']).term).toBe('오빠')
  })
})

describe('resolveKinship · 시댁 / 처가', () => {
  it('아내가 부르는 남편의 가족', () => {
    expect(female(['husband', 'father']).term).toBe('시아버지')
    expect(female(['husband', 'elderBrother']).term).toBe('아주버님')
    expect(female(['husband', 'youngerSister']).term).toBe('아가씨')
  })

  it('남편이 부르는 아내의 가족', () => {
    expect(male(['wife', 'father']).term).toBe('장인어른')
    expect(male(['wife', 'elderSister']).term).toBe('처형')
    expect(male(['wife', 'youngerSister']).term).toBe('처제')
    expect(male(['wife', 'youngerBrother']).term).toBe('처남')
  })
})

describe('resolveKinship · 사전에 없는 조합', () => {
  it('호칭은 못 찾아도 촌수와 경로는 알려준다', () => {
    const r = male(['father', 'father', 'father', 'elderBrother', 'son', 'son'])
    expect(r.valid).toBe(true)
    expect(r.term).toBeNull()
    expect(r.degree).toBe(3 + 2 + 1 + 1)
    expect(r.path).toContain('나의 아버지의')
  })

  it('빈 경로는 valid=false', () => {
    const r = male([])
    expect(r.valid).toBe(false)
    expect(r.term).toBeNull()
    expect(r.path).toBe('나')
  })
})

describe('EXAMPLES · 예시 버튼', () => {
  it('모든 예시가 사전에서 호칭을 찾는다', () => {
    for (const ex of EXAMPLES) {
      // 처제·형수님은 성별 제약이 있으므로 둘 중 하나에서는 찾혀야 한다
      const found = male(ex.steps).term ?? female(ex.steps).term
      expect(found, ex.label).not.toBeNull()
    }
  })

  it('예시 라벨이 실제 결과와 일치한다', () => {
    for (const ex of EXAMPLES) {
      const term = male(ex.steps).term ?? female(ex.steps).term
      expect(term, ex.label).toBe(ex.label)
    }
  })
})
