<script setup lang="ts">
import type { IconName } from '@/core/types'

/**
 * 아이콘 라이브러리를 쓰지 않고 path 맵을 직접 둔다.
 * 아이콘 이름을 문자열(메타데이터)로 다뤄야 하는데, 라이브러리를 쓰면
 * 동적 이름 때문에 전체 아이콘 세트가 번들에 포함되기 때문이다.
 * 출처: Lucide (ISC License) 기반 24x24 stroke 아이콘.
 */
const PATHS: Record<IconName, string> = {
  calculator:
    'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM7 7h10M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
  percent:
    'M19 5 5 19M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  ruler: 'M3 9l6-6 12 12-6 6zM7 7l2 2M11 11l2 2M15 15l2 2',
  weight: 'M12 3a3 3 0 0 0-2.83 4H6.5L4 21h16l-2.5-14h-2.67A3 3 0 0 0 12 3z',
  thermometer: 'M14 14.76V4a2 2 0 0 0-4 0v10.76a4 4 0 1 0 4 0z',
  square: 'M4 4h16v16H4zM4 10h16M10 4v16',
  banknote: 'M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 10v.01M18 14v.01',
  landmark: 'M3 21h18M4 10h16M5 10V7l7-4 7 4v3M7 10v11M12 10v11M17 10v11',
  'trending-up': 'M22 7 13.5 15.5l-4-4L2 19M16 7h6v6',
  sigma: 'M18 5H6l6 7-6 7h12',
  calendar: 'M8 2v4M16 2v4M3 6h18v15H3zM3 11h18',
  cake: 'M4 21h16v-7H4zM4 14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2M12 12V8M12 5V3',
  'heart-pulse':
    'M20.4 5.6a5.4 5.4 0 0 0-7.6 0L12 6.4l-.8-.8a5.4 5.4 0 0 0-7.6 7.6L12 21l8.4-7.8a5.4 5.4 0 0 0 0-7.6zM3.5 12h3l1.5-3 2 5 2-3h4',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  type: 'M4 6V4h16v2M12 4v16M9 20h6',
  dices: 'M3 8h10v10H3zM8 3h10v10M8 12h.01M11 15h.01',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  star: 'M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.8l6.5-.9z',
  'star-filled': 'M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.8l6.5-.9z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M18 6 6 18M6 6l12 12',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  check: 'M20 6 9 17l-5-5',
  'chevron-right': 'M9 18l6-6-6-6',
  'chevron-down': 'M6 9l6 6 6-6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  wifi: 'M5 12.5a10 10 0 0 1 14 0M8.5 16a6 6 0 0 1 7 0M12 20h.01',
}

const props = withDefaults(defineProps<{ name: IconName; size?: number | string }>(), {
  size: 20,
})
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    :class="props.name === 'star-filled' ? 'fill-current' : ''"
  >
    <path :d="PATHS[props.name]" />
  </svg>
</template>
