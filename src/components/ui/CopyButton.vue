<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { useClipboard } from '@/composables/useClipboard'

const props = withDefaults(defineProps<{ text: string; label?: string }>(), { label: '복사' })

const { copied, copy } = useClipboard()
const failed = ref(false)

async function onClick() {
  failed.value = !(await copy(props.text))
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-ink"
    :aria-label="`${props.label}: ${props.text}`"
    @click="onClick"
  >
    <AppIcon :name="copied ? 'check' : 'copy'" :size="14" />
    <span>{{ failed ? '복사 불가' : copied ? '복사됨' : props.label }}</span>
  </button>
</template>
