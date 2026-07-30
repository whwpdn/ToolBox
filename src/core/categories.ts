import type { Category, CategoryId } from './types'

/**
 * 카테고리 정의의 단일 소스.
 * 새 카테고리를 추가할 때는 이 배열과 types.ts 의 CategoryId 유니온만 수정한다.
 */
const defined: Category[] = [
  {
    id: 'calculator',
    name: '계산기',
    description: '일반·퍼센트 등 기본 계산',
    icon: 'calculator',
    order: 10,
  },
  {
    id: 'unit',
    name: '단위 변환',
    description: '길이·무게·온도·면적 변환',
    icon: 'ruler',
    order: 20,
  },
  {
    id: 'finance',
    name: '금융 · 부동산',
    description: '이자·대출·세금·급여 계산',
    icon: 'banknote',
    order: 30,
  },
  {
    id: 'math',
    name: '수학 · 공식',
    description: '공식 모음, 진법, 통계',
    icon: 'sigma',
    order: 40,
  },
  {
    id: 'datetime',
    name: '날짜 · 시간',
    description: '날짜 차이, 만 나이, D-Day',
    icon: 'calendar',
    order: 50,
  },
  {
    id: 'health',
    name: '건강 · 생활',
    description: 'BMI, 칼로리, 생활 요금',
    icon: 'heart-pulse',
    order: 60,
  },
  {
    id: 'text',
    name: '텍스트 · 개발',
    description: '글자수, 인코딩, 변환',
    icon: 'code',
    order: 70,
  },
  {
    id: 'random',
    name: '랜덤 · 추첨',
    description: '로또, 뽑기, 팀 나누기',
    icon: 'dices',
    order: 80,
  },
]

export const categories: Category[] = [...defined].sort((a, b) => a.order - b.order)

export const categoryById = new Map<CategoryId, Category>(categories.map((c) => [c.id, c]))

export function categoryName(id: CategoryId): string {
  return categoryById.get(id)?.name ?? id
}
