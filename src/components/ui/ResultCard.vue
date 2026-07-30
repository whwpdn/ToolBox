<script setup lang="ts">
import CopyButton from './CopyButton.vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: string
    /** 값 아래 보조 설명 */
    note?: string
    copyable?: boolean
    /** true면 강조 스타일(도구의 핵심 결과 1개에만 사용) */
    primary?: boolean
  }>(),
  { copyable: false, primary: false },
)
</script>

<template>
  <div
    class="rounded-xl border p-4"
    :class="props.primary ? 'border-brand bg-brand-soft' : 'border-line bg-surface'"
  >
    <div class="flex items-start justify-between gap-2">
      <span class="text-sm text-muted">{{ props.label }}</span>
      <CopyButton v-if="props.copyable" :text="props.value" />
    </div>
    <p
      class="tabular mt-1 font-semibold break-all"
      :class="props.primary ? 'text-2xl text-ink sm:text-3xl' : 'text-xl text-ink'"
    >
      {{ props.value }}
    </p>
    <p v-if="props.note" class="mt-1 text-xs text-muted">{{ props.note }}</p>
  </div>
</template>
