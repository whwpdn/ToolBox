<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ToolCard from '@/components/ToolCard.vue'
import { tools } from '@/core/registry'

const suggestions = tools.slice(0, 3)
</script>

<template>
  <div class="py-10 text-center">
    <p class="text-sm font-medium text-muted">404</p>
    <h1 class="mt-2 text-2xl font-semibold text-ink">페이지를 찾을 수 없습니다</h1>
    <p class="mt-2 text-sm text-muted">
      주소가 바뀌었거나 없는 도구입니다.
      <kbd class="rounded border border-line px-1.5 py-0.5 text-xs">Ctrl</kbd>
      +
      <kbd class="rounded border border-line px-1.5 py-0.5 text-xs">K</kbd>
      로 도구를 검색해 보세요.
    </p>

    <RouterLink
      to="/"
      class="mt-5 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink"
    >
      홈으로 가기
    </RouterLink>

    <div class="mt-10 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
      <ToolCard v-for="tool in suggestions" :key="tool.id" :tool="tool" show-category />
    </div>
  </div>
</template>
