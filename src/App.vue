<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
</script>

<template>
  <AppShell>
    <RouterView v-slot="{ Component }">
      <!-- 도구 chunk 로드 중에도 레이아웃은 유지된다 -->
      <Suspense>
        <component :is="Component" />
        <template #fallback>
          <div class="py-20 text-center text-sm text-muted">불러오는 중…</div>
        </template>
      </Suspense>
    </RouterView>
  </AppShell>
</template>
