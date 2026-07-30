<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import FavoriteToggle from '@/components/FavoriteToggle.vue'
import ToolCard from '@/components/ToolCard.vue'
import { categoryById } from '@/core/categories'
import { toolById, toolsInCategory } from '@/core/registry'
import { useUsageStore } from '@/stores/usage'

/**
 * 모든 도구 페이지의 공통 프레임.
 * 도구는 inputs / result / note 슬롯만 채우면 되고,
 * 제목·브레드크럼·즐겨찾기·관련 도구는 여기서 라우트 메타로부터 만들어진다.
 */
const props = withDefaults(defineProps<{ wide?: boolean }>(), { wide: false })

const route = useRoute()
const usage = useUsageStore()

const tool = computed(() => {
  const id = route.meta.toolId as string | undefined
  return id ? toolById.get(id) : undefined
})

const category = computed(() => (tool.value ? categoryById.get(tool.value.category) : undefined))

/** 같은 카테고리의 다른 도구 (최대 3개) */
const related = computed(() => {
  if (!tool.value) return []
  return toolsInCategory(tool.value.category)
    .filter((t) => t.id !== tool.value?.id)
    .slice(0, 3)
})

onMounted(() => {
  if (tool.value) usage.markVisited(tool.value.id)
})
</script>

<template>
  <article v-if="tool">
    <nav class="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted" aria-label="현재 위치">
      <RouterLink to="/" class="hover:text-brand">홈</RouterLink>
      <AppIcon name="chevron-right" :size="12" />
      <RouterLink v-if="category" :to="`/c/${category.id}`" class="hover:text-brand">
        {{ category.name }}
      </RouterLink>
      <AppIcon name="chevron-right" :size="12" />
      <span class="text-ink">{{ tool.title }}</span>
    </nav>

    <header class="mb-6 flex items-start gap-3">
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"
      >
        <AppIcon :name="tool.icon" :size="20" />
      </span>
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-semibold text-ink sm:text-2xl">{{ tool.title }}</h1>
        <p class="mt-0.5 text-sm text-muted">{{ tool.description }}</p>
      </div>
      <FavoriteToggle :tool-id="tool.id" class="shrink-0" />
    </header>

    <!-- 기본 슬롯을 쓰면 입력/결과 2단 그리드 대신 도구가 레이아웃을 직접 정한다 -->
    <slot v-if="$slots.default" />
    <div
      v-else
      class="grid gap-6"
      :class="props.wide ? 'grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'"
    >
      <section class="space-y-4" aria-label="입력">
        <slot name="inputs" />
      </section>

      <section class="space-y-4" aria-label="결과">
        <slot name="result" />
      </section>
    </div>

    <div v-if="$slots.extra" class="mt-6">
      <slot name="extra" />
    </div>

    <div v-if="$slots.note" class="mt-6">
      <slot name="note" />
    </div>

    <section v-if="related.length" class="mt-10">
      <h2 class="mb-3 text-sm font-semibold text-ink">관련 도구</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ToolCard v-for="t in related" :key="t.id" :tool="t" />
      </div>
    </section>
  </article>
</template>
