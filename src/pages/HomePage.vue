<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import ToolCard from '@/components/ToolCard.vue'
import { categories } from '@/core/categories'
import { activeCategoryIds, tools, toolsInCategory } from '@/core/registry'
import { useUsageStore } from '@/stores/usage'

const usage = useUsageStore()

const active = activeCategoryIds()
const visibleCategories = computed(() => categories.filter((c) => active.has(c.id)))
</script>

<template>
  <div class="space-y-10">
    <section>
      <h1 class="text-2xl font-semibold text-ink sm:text-3xl">일상에 필요한 계산, 한곳에서</h1>
      <p class="mt-2 text-muted">
        계산기 · 단위 변환 · 이자 · 대출 한도 등 {{ tools.length }}개의 도구.
        <span class="hidden sm:inline">
          <kbd class="rounded border border-line px-1.5 py-0.5 text-xs">Ctrl</kbd>
          +
          <kbd class="rounded border border-line px-1.5 py-0.5 text-xs">K</kbd>
          로 바로 검색하세요.
        </span>
      </p>
    </section>

    <section v-if="usage.favoriteTools.length">
      <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <AppIcon name="star-filled" :size="15" class="text-brand" />
        즐겨찾기
      </h2>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ToolCard v-for="tool in usage.favoriteTools" :key="tool.id" :tool="tool" show-category />
      </div>
    </section>

    <section v-if="usage.recentTools.length">
      <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <AppIcon name="clock" :size="15" class="text-muted" />
        최근 사용
      </h2>
      <div class="flex flex-wrap gap-2">
        <RouterLink
          v-for="tool in usage.recentTools"
          :key="tool.id"
          :to="`/tools/${tool.id}`"
          class="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:border-brand hover:text-brand"
        >
          <AppIcon :name="tool.icon" :size="14" />
          {{ tool.title }}
        </RouterLink>
      </div>
    </section>

    <section v-for="cat in visibleCategories" :key="cat.id">
      <div class="mb-3 flex items-baseline justify-between gap-2">
        <h2 class="flex items-center gap-2 text-sm font-semibold text-ink">
          <AppIcon :name="cat.icon" :size="15" class="text-muted" />
          {{ cat.name }}
        </h2>
        <RouterLink :to="`/c/${cat.id}`" class="text-xs text-muted hover:text-brand">
          전체 보기
        </RouterLink>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ToolCard v-for="tool in toolsInCategory(cat.id)" :key="tool.id" :tool="tool" />
      </div>
    </section>
  </div>
</template>
