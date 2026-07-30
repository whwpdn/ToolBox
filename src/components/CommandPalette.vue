<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from './ui/AppIcon.vue'
import type { ToolEntry } from '@/core/types'
import { categoryName } from '@/core/categories'
import { tools } from '@/core/registry'
import { useUsageStore } from '@/stores/usage'

const open = defineModel<boolean>('open', { required: true })

const router = useRouter()
const usage = useUsageStore()

const query = ref('')
const cursor = ref(0)
const inputEl = ref<HTMLInputElement>()
const results = ref<ToolEntry[]>([])

/**
 * Fuse.js는 팔레트를 처음 열 때 동적으로 로드한다.
 * 홈 첫 로드 번들에 검색 엔진을 포함시키지 않기 위한 것.
 */
let searchFn: ((q: string) => ToolEntry[]) | null = null

async function ensureSearch() {
  if (!searchFn) {
    const mod = await import('@/core/search')
    searchFn = mod.searchTools
  }
  return searchFn
}

/** 검색어가 없을 때는 최근 사용 → 즐겨찾기 → 전체 앞부분을 보여준다 */
const fallbackList = computed<ToolEntry[]>(() => {
  const seen = new Set<string>()
  const list: ToolEntry[] = []
  for (const t of [...usage.recentTools, ...usage.favoriteTools, ...tools]) {
    if (seen.has(t.id)) continue
    seen.add(t.id)
    list.push(t)
    if (list.length >= 8) break
  }
  return list
})

const visible = computed<ToolEntry[]>(() =>
  query.value.trim() ? results.value : fallbackList.value,
)

const listLabel = computed(() => (query.value.trim() ? '검색 결과' : '바로 가기'))

watch(query, async (q) => {
  cursor.value = 0
  if (!q.trim()) {
    results.value = []
    return
  }
  const fn = await ensureSearch()
  // await 사이에 입력이 더 들어왔을 수 있으므로 최신 질의인지 확인한다
  if (query.value === q) results.value = fn(q)
})

watch(open, async (isOpen) => {
  if (isOpen) {
    query.value = ''
    results.value = []
    cursor.value = 0
    void ensureSearch()
    await nextTick()
    inputEl.value?.focus()
  }
})

function move(delta: number) {
  const len = visible.value.length
  if (len === 0) return
  cursor.value = (cursor.value + delta + len) % len
}

function go(tool: ToolEntry | undefined) {
  if (!tool) return
  open.value = false
  void router.push(`/tools/${tool.id}`)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="도구 검색"
    >
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="open = false" />

      <div
        class="relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
      >
        <div class="flex items-center gap-2 border-b border-line px-4">
          <AppIcon name="search" :size="18" class="shrink-0 text-muted" />
          <input
            ref="inputEl"
            v-model="query"
            type="text"
            placeholder="도구 검색 (예: 대출, ㄷㅊ, bmi)"
            class="min-w-0 flex-1 bg-transparent py-3.5 text-base outline-none placeholder:text-muted"
            aria-label="도구 검색어"
            autocomplete="off"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="go(visible[cursor])"
            @keydown.esc.prevent="open = false"
          />
          <kbd class="hidden shrink-0 text-xs text-muted sm:block">ESC</kbd>
        </div>

        <p class="px-4 pt-3 pb-1 text-xs font-medium text-muted">{{ listLabel }}</p>

        <ul v-if="visible.length" class="max-h-[50vh] overflow-y-auto pb-2">
          <li v-for="(tool, i) in visible" :key="tool.id">
            <button
              type="button"
              class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
              :class="i === cursor ? 'bg-brand-soft' : 'hover:bg-surface-hover'"
              @click="go(tool)"
              @mouseenter="cursor = i"
            >
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"
              >
                <AppIcon :name="tool.icon" :size="16" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-ink">{{ tool.title }}</span>
                <span class="block truncate text-xs text-muted">{{ tool.description }}</span>
              </span>
              <span class="shrink-0 text-xs text-muted">{{ categoryName(tool.category) }}</span>
            </button>
          </li>
        </ul>

        <div v-else class="px-4 py-8 text-center">
          <p class="text-sm text-ink">'{{ query }}' 검색 결과가 없습니다</p>
          <p class="mt-1 text-xs text-muted">
            다른 이름이나 초성으로 찾아보세요. 카테고리에서 직접 둘러볼 수도 있습니다.
          </p>
          <div class="mt-3 flex flex-wrap justify-center gap-1.5">
            <RouterLink
              v-for="c in ['calculator', 'unit', 'finance', 'datetime']"
              :key="c"
              :to="`/c/${c}`"
              class="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-brand hover:text-brand"
              @click="open = false"
            >
              {{ categoryName(c as never) }}
            </RouterLink>
          </div>
        </div>

        <div
          class="flex items-center justify-between border-t border-line px-4 py-2 text-xs text-muted"
        >
          <span>↑↓ 이동 · Enter 열기</span>
          <span>{{ visible.length }}개</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
