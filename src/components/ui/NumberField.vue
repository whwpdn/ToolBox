<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { formatNumber, toNumber } from '@/utils/number'

/**
 * 숫자 입력 필드.
 * 표시할 때는 천단위 구분자를 넣고, 편집 중에는 원본 문자열을 유지해
 * '1,0' 같은 중간 상태에서 커서가 튀지 않게 한다.
 */
const props = withDefaults(
  defineProps<{
    modelValue: number
    label: string
    suffix?: string
    hint?: string
    thousands?: boolean
    step?: number
    min?: number
    max?: number
    /** 소수점 허용 자리수 (표시용) */
    digits?: number
    /** 값 정렬. 단위 변환처럼 값이 주인공인 화면은 center가 읽기 좋다 */
    align?: 'left' | 'center' | 'right'
    /** step 만큼 올리고 내리는 위/아래 버튼 표시 */
    stepper?: boolean
  }>(),
  { thousands: false, step: 1, digits: 0, align: 'right', stepper: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const focused = ref(false)
const draft = ref('')

const display = computed(() => {
  if (focused.value) return draft.value
  if (props.thousands) return formatNumber(props.modelValue, props.digits)
  return String(props.modelValue)
})

watch(
  () => props.modelValue,
  (v) => {
    if (!focused.value) draft.value = String(v)
  },
  { immediate: true },
)

const outOfRange = computed(() => {
  const v = props.modelValue
  if (props.min !== undefined && v < props.min)
    return `${formatNumber(props.min)} 이상이어야 합니다`
  if (props.max !== undefined && v > props.max) return `${formatNumber(props.max)} 이하여야 합니다`
  return ''
})

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  draft.value = raw
  emit('update:modelValue', toNumber(raw, 0))
}

function onFocus() {
  draft.value = props.modelValue === 0 ? '' : String(props.modelValue)
  focused.value = true
}

function onBlur() {
  focused.value = false
  // 범위를 벗어난 값은 되돌리지 않고 경고만 남긴다(사용자 입력을 임의로 바꾸지 않는다)
  emit('update:modelValue', toNumber(draft.value, 0))
}

const ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

/** 위/아래 버튼과 ↑↓ 키가 같은 경로를 쓰도록 한 곳에 둔다 */
function nudge(direction: 1 | -1) {
  const next = props.modelValue + direction * props.step
  const clamped =
    props.min !== undefined && next < props.min
      ? props.min
      : props.max !== undefined && next > props.max
        ? props.max
        : next
  emit('update:modelValue', Number(clamped.toFixed(6)))
}
</script>

<template>
  <label class="block">
    <span class="mb-1.5 flex items-baseline justify-between gap-2">
      <span class="text-sm font-medium text-ink">{{ props.label }}</span>
      <span v-if="props.hint" class="text-xs text-muted">{{ props.hint }}</span>
    </span>

    <span
      class="flex items-stretch overflow-hidden rounded-lg border bg-surface transition-colors"
      :class="outOfRange ? 'border-danger' : 'border-line focus-within:border-brand'"
    >
      <input
        :value="display"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        class="tabular min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base outline-none"
        :class="ALIGN_CLASS[props.align]"
        :aria-invalid="!!outOfRange"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown.up.prevent="nudge(1)"
        @keydown.down.prevent="nudge(-1)"
      />
      <span
        v-if="props.suffix"
        class="flex shrink-0 items-center border-l border-line px-2.5 text-sm text-muted"
      >
        {{ props.suffix }}
      </span>

      <!-- 위/아래 버튼. ↑↓ 키와 동일하게 step 단위로 움직인다 -->
      <span v-if="props.stepper" class="flex shrink-0 flex-col border-l border-line">
        <button
          type="button"
          class="flex flex-1 items-center justify-center px-2 text-muted transition-colors hover:bg-surface-hover hover:text-brand"
          :aria-label="`${props.step} 올리기`"
          tabindex="-1"
          @click="nudge(1)"
        >
          <AppIcon name="chevron-down" :size="14" class="rotate-180" />
        </button>
        <button
          type="button"
          class="flex flex-1 items-center justify-center border-t border-line px-2 text-muted transition-colors hover:bg-surface-hover hover:text-brand"
          :aria-label="`${props.step} 내리기`"
          tabindex="-1"
          @click="nudge(-1)"
        >
          <AppIcon name="chevron-down" :size="14" />
        </button>
      </span>
    </span>

    <span v-if="outOfRange" class="mt-1 block text-xs text-danger">{{ outOfRange }}</span>
  </label>
</template>
