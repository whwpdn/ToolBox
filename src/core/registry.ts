import type { Component } from 'vue'
import type { CategoryId, ToolEntry, ToolMeta } from './types'
import { categoryById } from './categories'

/**
 * 도구 자동 수집.
 *
 * meta.ts 만 eager로 읽어 목록·검색 인덱스를 만들고, View.vue 는 lazy로 남겨
 * 홈 진입 시에는 도구 코드가 로드되지 않게 한다.
 * 도구를 추가할 때 이 파일을 수정할 필요는 없다.
 */
const metaModules = import.meta.glob<{ default: ToolMeta }>('../tools/*/meta.ts', { eager: true })
const viewModules = import.meta.glob<{ default: Component }>('../tools/*/View.vue')

function collect(): ToolEntry[] {
  const entries: ToolEntry[] = []
  const seen = new Set<string>()

  for (const [path, mod] of Object.entries(metaModules)) {
    const dir = path.replace(/\/meta\.ts$/, '')
    const folder = dir.split('/').pop() ?? ''
    const meta = mod.default

    if (!meta?.id) {
      throw new Error(`[registry] ${path}: meta의 default export에 id가 없습니다`)
    }
    if (meta.id !== folder) {
      throw new Error(`[registry] ${path}: meta.id('${meta.id}')와 폴더명('${folder}')이 다릅니다`)
    }
    if (seen.has(meta.id)) {
      throw new Error(`[registry] 도구 id가 중복되었습니다: '${meta.id}'`)
    }
    if (!categoryById.has(meta.category)) {
      throw new Error(`[registry] ${path}: 알 수 없는 카테고리 '${meta.category}'`)
    }

    const loader = viewModules[`${dir}/View.vue`]
    if (!loader) {
      throw new Error(`[registry] ${dir}: View.vue 가 없습니다`)
    }

    seen.add(meta.id)
    if (meta.enabled === false) continue

    entries.push({
      ...meta,
      component: () => loader().then((m) => m.default),
    })
  }

  return entries.sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title, 'ko'),
  )
}

export const tools: ToolEntry[] = collect()

export const toolById = new Map<string, ToolEntry>(tools.map((t) => [t.id, t]))

export function toolsInCategory(category: CategoryId): ToolEntry[] {
  return tools.filter((t) => t.category === category)
}

/** 도구가 하나 이상 있는 카테고리만 (빈 카테고리를 홈에 노출하지 않기 위해) */
export function activeCategoryIds(): Set<CategoryId> {
  return new Set(tools.map((t) => t.category))
}
