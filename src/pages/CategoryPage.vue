<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import ToolCard from '@/components/ToolCard.vue'
import { categoryById } from '@/core/categories'
import { toolsInCategory } from '@/core/registry'
import type { CategoryId } from '@/core/types'

const route = useRoute()

const category = computed(() => categoryById.get(route.params.categoryId as CategoryId))
const list = computed(() => (category.value ? toolsInCategory(category.value.id) : []))

watchEffect(() => {
  if (category.value) document.title = `${category.value.name} · ToolBox`
})
</script>

<template>
  <div v-if="category">
    <nav class="mb-3 flex items-center gap-1 text-xs text-muted" aria-label="현재 위치">
      <RouterLink to="/" class="hover:text-brand">홈</RouterLink>
      <AppIcon name="chevron-right" :size="12" />
      <span class="text-ink">{{ category.name }}</span>
    </nav>

    <header class="mb-6 flex items-start gap-3">
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"
      >
        <AppIcon :name="category.icon" :size="20" />
      </span>
      <div>
        <h1 class="text-xl font-semibold text-ink sm:text-2xl">{{ category.name }}</h1>
        <p class="mt-0.5 text-sm text-muted">{{ category.description }}</p>
      </div>
    </header>

    <div v-if="list.length" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <ToolCard v-for="tool in list" :key="tool.id" :tool="tool" />
    </div>
    <p v-else class="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
      이 카테고리에는 아직 도구가 없습니다.
    </p>
  </div>
</template>
