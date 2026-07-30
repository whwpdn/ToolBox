import Fuse from 'fuse.js'
import type { ToolEntry } from './types'
import { tools } from './registry'
import { categoryName } from './categories'
import { isChoseongOnly, matchChoseong } from '@/utils/hangul'

interface IndexedTool extends ToolEntry {
  categoryLabel: string
}

const indexed: IndexedTool[] = tools.map((t) => ({ ...t, categoryLabel: categoryName(t.category) }))

const fuse = new Fuse(indexed, {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'keywords', weight: 2 },
    { name: 'categoryLabel', weight: 1.5 },
    { name: 'description', weight: 1 },
  ],
  threshold: 0.4, // 오타 허용
  ignoreLocation: true,
  minMatchCharLength: 1,
})

const MAX_RESULTS = 12

/**
 * 도구 검색.
 * 초성만 입력한 경우('ㄷㅊ')는 퍼지 검색이 무의미하므로 초성 매칭으로 분기한다.
 */
export function searchTools(query: string): ToolEntry[] {
  const q = query.trim()
  if (!q) return []

  if (isChoseongOnly(q)) {
    return indexed
      .filter((t) => matchChoseong(t.title, q) || t.keywords.some((k) => matchChoseong(k, q)))
      .slice(0, MAX_RESULTS)
  }

  return fuse
    .search(q)
    .slice(0, MAX_RESULTS)
    .map((r) => r.item)
}
