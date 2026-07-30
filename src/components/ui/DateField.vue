<script setup lang="ts">
import { computed } from 'vue'
import { formatKorean, parseISODate } from '@/utils/date'

const props = defineProps<{
  modelValue: string
  label: string
  hint?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const parsed = computed(() => parseISODate(props.modelValue))
const invalid = computed(() => props.modelValue.length > 0 && !parsed.value)
</script>

<template>
  <label class="block">
    <span class="mb-1.5 flex items-baseline justify-between gap-2">
      <span class="text-sm font-medium text-ink">{{ props.label }}</span>
      <span class="text-xs text-muted">
        {{ props.hint ?? (parsed ? formatKorean(parsed) : '') }}
      </span>
    </span>
    <input
      :value="props.modelValue"
      type="date"
      class="tabular w-full rounded-lg border bg-surface px-3 py-2.5 text-base text-ink outline-none"
      :class="invalid ? 'border-danger' : 'border-line focus:border-brand'"
      :aria-invalid="invalid"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="invalid" class="mt-1 block text-xs text-danger">
      올바른 날짜를 입력하세요 (YYYY-MM-DD)
    </span>
  </label>
</template>
