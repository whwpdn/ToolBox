import type { Component } from 'vue'

export type CategoryId =
  'calculator' | 'unit' | 'finance' | 'math' | 'datetime' | 'health' | 'text' | 'random'

export interface Category {
  id: CategoryId
  name: string
  description: string
  icon: IconName
  /** 홈·사이드바 정렬 순서. 낮을수록 앞 */
  order: number
}

export interface ToolMeta {
  /** URL 슬러그(`/tools/<id>`). 폴더명과 같아야 하고, 배포 후에는 바꾸지 않는다 */
  id: string
  title: string
  /** 카드·검색 결과에 노출되는 한 줄 설명 */
  description: string
  category: CategoryId
  /** 검색어. 정식명칭·줄임말·구어체·영문을 넉넉히 넣는다 */
  keywords: string[]
  icon: IconName
  /** 카테고리 내 정렬 가중치. 낮을수록 앞 */
  order?: number
  /** false면 라우트·검색·목록에서 완전히 제외된다 */
  enabled?: boolean
  /** 네트워크가 필요한 도구는 true (오프라인 배지 표시용) */
  requiresNetwork?: boolean
}

export interface ToolEntry extends ToolMeta {
  /** 라우트 진입 시에만 로드되는 동적 import */
  component: () => Promise<Component>
}

/** components/ui/AppIcon.vue 의 path 맵 키 */
export type IconName =
  | 'calculator'
  | 'percent'
  | 'ruler'
  | 'weight'
  | 'thermometer'
  | 'square'
  | 'banknote'
  | 'landmark'
  | 'trending-up'
  | 'sigma'
  | 'calendar'
  | 'cake'
  | 'heart-pulse'
  | 'code'
  | 'type'
  | 'dices'
  | 'search'
  | 'star'
  | 'star-filled'
  | 'sun'
  | 'moon'
  | 'menu'
  | 'close'
  | 'copy'
  | 'check'
  | 'chevron-right'
  | 'chevron-down'
  | 'clock'
  | 'wifi'
