<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './ui/AppIcon.vue'
import { useUsageStore } from '@/stores/usage'

const props = defineProps<{ toolId: string }>()

const usage = useUsageStore()
const active = computed(() => usage.isFavorite(props.toolId))
</script>

<template>
  <button
    type="button"
    class="rounded-lg p-2 transition-colors hover:bg-surface-hover"
    :class="active ? 'text-brand' : 'text-muted'"
    :aria-pressed="active"
    :aria-label="active ? '즐겨찾기 해제' : '즐겨찾기 추가'"
    :title="active ? '즐겨찾기 해제' : '즐겨찾기 추가'"
    @click.stop.prevent="usage.toggleFavorite(props.toolId)"
  >
    <AppIcon :name="active ? 'star-filled' : 'star'" :size="18" />
  </button>
</template>
