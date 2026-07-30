import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { load, save } from '@/core/storage'
import { toolById } from '@/core/registry'
import type { ToolEntry } from '@/core/types'

const KEY = 'usage'
const VERSION = 1
const RECENT_LIMIT = 8

interface UsageData {
  favorites: string[]
  recent: string[]
}

export const useUsageStore = defineStore('usage', () => {
  const initial = load<UsageData>(KEY, VERSION, { favorites: [], recent: [] })

  // 삭제·비활성화된 도구의 id가 남아 있을 수 있으므로 레지스트리 기준으로 걸러낸다
  const favorites = ref<string[]>(initial.favorites.filter((id) => toolById.has(id)))
  const recent = ref<string[]>(initial.recent.filter((id) => toolById.has(id)))

  const favoriteTools = computed<ToolEntry[]>(() =>
    favorites.value.map((id) => toolById.get(id)).filter((t): t is ToolEntry => !!t),
  )

  const recentTools = computed<ToolEntry[]>(() =>
    recent.value.map((id) => toolById.get(id)).filter((t): t is ToolEntry => !!t),
  )

  function isFavorite(id: string): boolean {
    return favorites.value.includes(id)
  }

  function toggleFavorite(id: string) {
    if (!toolById.has(id)) return
    favorites.value = isFavorite(id)
      ? favorites.value.filter((v) => v !== id)
      : [...favorites.value, id]
  }

  function markVisited(id: string) {
    if (!toolById.has(id)) return
    recent.value = [id, ...recent.value.filter((v) => v !== id)].slice(0, RECENT_LIMIT)
  }

  watch(
    [favorites, recent],
    () => save<UsageData>(KEY, VERSION, { favorites: favorites.value, recent: recent.value }),
    { deep: true },
  )

  return { favorites, recent, favoriteTools, recentTools, isFavorite, toggleFavorite, markVisited }
})
