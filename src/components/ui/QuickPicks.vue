<script setup lang="ts">
import type { QuickPick } from './types'

/**
 * 자주 쓰는 값을 한 번에 넣는 칩 버튼 묶음.
 *
 * 두 가지 동작을 지원한다.
 * - set: 값을 그대로 치환한다. 기간처럼 '고르는' 값에 쓴다. 현재 값과 같으면 강조된다.
 * - add: 현재 값에 더한다. 금액처럼 '쌓아 올리는' 값에 쓴다(1억 + 5천만 = 1억 5천만).
 *
 * add 모드는 값을 줄일 수 없으므로 초기화 버튼을 함께 두는 것을 권장한다(clearable).
 */
const props = withDefaults(
  defineProps<{
    picks: QuickPick[]
    mode?: 'set' | 'add'
    /** set 모드에서 현재 선택된 값 강조에 사용 */
    active?: number
    label?: string
    /** add 모드에서 0으로 되돌리는 버튼 표시 */
    clearable?: boolean
  }>(),
  { mode: 'set', clearable: false },
)

const emit = defineEmits<{ pick: [value: number]; clear: [] }>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <span v-if="props.label" class="mr-0.5 text-xs text-muted">{{ props.label }}</span>

    <button
      v-for="pick in props.picks"
      :key="pick.label"
      type="button"
      class="rounded-full border px-2.5 py-1 text-xs transition-colors"
      :class="
        props.mode === 'set' && props.active === pick.value
          ? 'border-brand bg-brand-soft font-medium text-brand'
          : 'border-line bg-surface text-muted hover:border-brand hover:text-brand'
      "
      :aria-pressed="props.mode === 'set' ? props.active === pick.value : undefined"
      @click="emit('pick', pick.value)"
    >
      {{ props.mode === 'add' ? `+${pick.label}` : pick.label }}
    </button>

    <button
      v-if="props.clearable"
      type="button"
      class="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:border-danger hover:text-danger"
      @click="emit('clear')"
    >
      초기화
    </button>
  </div>
</template>
