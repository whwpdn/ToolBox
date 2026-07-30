<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import { categories } from '@/core/categories'
import { activeCategoryIds, toolsInCategory } from '@/core/registry'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const settings = useSettingsStore()

const paletteOpen = ref(false)
const drawerOpen = ref(false)

const active = activeCategoryIds()
const visibleCategories = computed(() => categories.filter((c) => active.has(c.id)))
const currentToolId = computed(() => route.meta.toolId as string | undefined)

function onKeydown(event: KeyboardEvent) {
  const isPaletteKey = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
  const target = event.target as HTMLElement | null
  const typing =
    target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

  // '/'는 입력 중이 아닐 때만 검색 단축키로 쓴다
  if (isPaletteKey || (event.key === '/' && !typing)) {
    event.preventDefault()
    paletteOpen.value = true
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// 라우트가 바뀌면 모바일 드로어를 닫는다
watch(
  () => route.fullPath,
  () => (drawerOpen.value = false),
)
</script>

<template>
  <div class="flex min-h-full flex-col">
    <header class="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <button
          type="button"
          class="-ml-1 rounded-lg p-2 text-muted hover:bg-surface-hover lg:hidden"
          aria-label="카테고리 메뉴 열기"
          @click="drawerOpen = true"
        >
          <AppIcon name="menu" />
        </button>

        <RouterLink to="/" class="flex items-center gap-2 font-semibold text-ink">
          <span class="flex size-7 items-center justify-center rounded-lg bg-brand text-brand-ink">
            <AppIcon name="calculator" :size="16" />
          </span>
          ToolBox
        </RouterLink>

        <div class="flex-1" />

        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:border-brand hover:text-ink"
          @click="paletteOpen = true"
        >
          <AppIcon name="search" :size="16" />
          <span class="hidden sm:inline">도구 검색</span>
          <kbd class="hidden rounded border border-line px-1.5 py-0.5 text-xs md:inline">
            Ctrl K
          </kbd>
        </button>

        <button
          type="button"
          class="rounded-lg p-2 text-muted hover:bg-surface-hover"
          aria-label="밝은/어두운 테마 전환"
          @click="settings.toggleTheme()"
        >
          <AppIcon name="sun" class="dark:hidden" />
          <AppIcon name="moon" class="hidden dark:block" />
        </button>
      </div>
    </header>

    <div class="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
      <!-- 데스크톱 사이드바 -->
      <aside class="hidden w-52 shrink-0 lg:block">
        <nav class="sticky top-20 space-y-6" aria-label="카테고리">
          <div v-for="cat in visibleCategories" :key="cat.id">
            <RouterLink
              :to="`/c/${cat.id}`"
              class="flex items-center gap-2 px-2 py-1 text-sm font-semibold text-ink hover:text-brand"
            >
              <AppIcon :name="cat.icon" :size="15" class="text-muted" />
              {{ cat.name }}
            </RouterLink>
            <ul class="mt-1 space-y-0.5">
              <li v-for="tool in toolsInCategory(cat.id)" :key="tool.id">
                <RouterLink
                  :to="`/tools/${tool.id}`"
                  class="block truncate rounded-md px-2 py-1.5 pl-7 text-sm transition-colors"
                  :class="
                    currentToolId === tool.id
                      ? 'bg-brand-soft font-medium text-brand'
                      : 'text-muted hover:bg-surface-hover hover:text-ink'
                  "
                >
                  {{ tool.title }}
                </RouterLink>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <main class="min-w-0 flex-1">
        <slot />
      </main>
    </div>

    <footer class="border-t border-line py-6">
      <div class="mx-auto max-w-6xl px-4 text-xs text-muted">
        <p>ToolBox · 모든 계산은 브라우저에서 처리되며 입력값은 외부로 전송되지 않습니다.</p>
        <p class="mt-1">
          금융·세금 관련 계산은 참고용이며, 실제 금융기관·기관의 산정 결과와 다를 수 있습니다.
        </p>
      </div>
    </footer>

    <!-- 모바일 드로어 -->
    <Teleport to="body">
      <div v-if="drawerOpen" class="fixed inset-0 z-40 lg:hidden">
        <div class="absolute inset-0 bg-black/40" @click="drawerOpen = false" />
        <nav
          class="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-line bg-canvas p-4"
          aria-label="카테고리"
        >
          <div class="mb-4 flex items-center justify-between">
            <span class="font-semibold text-ink">카테고리</span>
            <button
              type="button"
              class="rounded-lg p-2 text-muted hover:bg-surface-hover"
              aria-label="메뉴 닫기"
              @click="drawerOpen = false"
            >
              <AppIcon name="close" :size="18" />
            </button>
          </div>

          <div v-for="cat in visibleCategories" :key="cat.id" class="mb-5">
            <RouterLink
              :to="`/c/${cat.id}`"
              class="flex items-center gap-2 px-2 py-1 text-sm font-semibold text-ink"
            >
              <AppIcon :name="cat.icon" :size="15" class="text-muted" />
              {{ cat.name }}
            </RouterLink>
            <ul class="mt-1 space-y-0.5">
              <li v-for="tool in toolsInCategory(cat.id)" :key="tool.id">
                <RouterLink
                  :to="`/tools/${tool.id}`"
                  class="block truncate rounded-md px-2 py-2 pl-7 text-sm transition-colors"
                  :class="
                    currentToolId === tool.id
                      ? 'bg-brand-soft font-medium text-brand'
                      : 'text-muted hover:bg-surface-hover'
                  "
                >
                  {{ tool.title }}
                </RouterLink>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </Teleport>

    <CommandPalette v-model:open="paletteOpen" />
  </div>
</template>
