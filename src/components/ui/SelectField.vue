<script setup lang="ts">
import type { SelectOption } from './types'

const props = defineProps<{
  modelValue: string
  label: string
  options: SelectOption[]
  hint?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <label class="block">
    <span class="mb-1.5 flex items-baseline justify-between gap-2">
      <span class="text-sm font-medium text-ink">{{ props.label }}</span>
      <span v-if="props.hint" class="text-xs text-muted">{{ props.hint }}</span>
    </span>
    <select
      :value="props.modelValue"
      class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-brand"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="opt in props.options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </label>
</template>
