<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppIcon from './ui/AppIcon.vue'
import FavoriteToggle from './FavoriteToggle.vue'
import type { ToolEntry } from '@/core/types'
import { categoryName } from '@/core/categories'

const props = withDefaults(defineProps<{ tool: ToolEntry; showCategory?: boolean }>(), {
  showCategory: false,
})
</script>

<template>
  <RouterLink
    :to="`/tools/${props.tool.id}`"
    class="group flex items-start gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand hover:bg-surface-hover"
  >
    <span
      class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"
    >
      <AppIcon :name="props.tool.icon" :size="18" />
    </span>

    <span class="min-w-0 flex-1">
      <span class="flex items-center gap-1.5">
        <span class="truncate font-medium text-ink">{{ props.tool.title }}</span>
        <AppIcon
          v-if="props.tool.requiresNetwork"
          name="wifi"
          :size="13"
          class="shrink-0 text-muted"
        />
      </span>
      <span class="mt-0.5 line-clamp-2 block text-sm text-muted">
        {{ props.tool.description }}
      </span>
      <span v-if="props.showCategory" class="mt-1.5 inline-block text-xs text-muted">
        {{ categoryName(props.tool.category) }}
      </span>
    </span>

    <FavoriteToggle :tool-id="props.tool.id" class="-mt-1 -mr-1 shrink-0" />
  </RouterLink>
</template>
