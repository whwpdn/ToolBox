#!/usr/bin/env node
/**
 * 새 도구 폴더를 만든다.
 *
 *   npm run new:tool -- <tool-id> <카테고리> "<도구 이름>"
 *   npm run new:tool -- savings finance "예금·적금 만기 계산기"
 *
 * meta.ts / View.vue / logic.ts / logic.spec.ts 골격을 생성한다.
 * 레지스트리가 폴더를 자동으로 수집하므로 추가 등록 작업은 없다.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const [id, category, ...titleParts] = process.argv.slice(2)
const title = titleParts.join(' ')

const CATEGORIES = ['calculator', 'unit', 'finance', 'math', 'datetime', 'health', 'text', 'random']

function fail(message) {
  console.error(`\n✖ ${message}\n`)
  console.error('사용법: npm run new:tool -- <tool-id> <카테고리> "<도구 이름>"')
  console.error(`카테고리: ${CATEGORIES.join(', ')}\n`)
  process.exit(1)
}

if (!id || !category || !title) fail('인자가 부족합니다')
if (!/^[a-z][a-z0-9-]*$/.test(id)) fail(`도구 id는 kebab-case여야 합니다: '${id}'`)
if (!CATEGORIES.includes(category)) fail(`알 수 없는 카테고리: '${category}'`)

const dir = join(ROOT, 'src', 'tools', id)
if (existsSync(dir)) fail(`이미 존재하는 도구입니다: src/tools/${id}`)

// 아이콘 이름은 types.ts의 IconName 유니온에 있는 것만 쓸 수 있다
const iconsSource = await readFile(join(ROOT, 'src', 'core', 'types.ts'), 'utf8')
const iconMatch = /export type IconName =([\s\S]*?)\n\n|export type IconName =([\s\S]*)$/.exec(
  iconsSource,
)
const availableIcons = [...(iconMatch?.[1] ?? iconMatch?.[2] ?? '').matchAll(/'([^']+)'/g)].map(
  (m) => m[1],
)

const camel = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
const pascal = camel.charAt(0).toUpperCase() + camel.slice(1)

const files = {
  'meta.ts': `import type { ToolMeta } from '@/core/types'

const meta: ToolMeta = {
  id: '${id}',
  title: '${title}',
  description: 'TODO: 한 줄 설명 (카드·검색 결과에 노출됩니다)',
  category: '${category}',
  keywords: [
    // 이 도구를 찾을 때 실제로 칠 만한 말을 넉넉히 넣으세요.
    // 정식명칭 + 줄임말 + 구어체 + 영문. 초성 검색은 title/keywords에서 자동 생성됩니다.
    '${title}',
  ],
  icon: '${availableIcons[0] ?? 'calculator'}', // 사용 가능: ${availableIcons.slice(0, 8).join(', ')} ...
  order: 100,
}

export default meta
`,

  'logic.ts': `/**
 * ${title} 계산 로직.
 *
 * Vue를 import하지 않는 순수 함수로 유지하세요.
 * 그래야 logic.spec.ts에서 UI 없이 검증할 수 있고, 다른 도구에서 재사용할 수 있습니다.
 */

export interface ${pascal}Input {
  // TODO: 입력 타입 정의
  value: number
}

export interface ${pascal}Result {
  // TODO: 출력 타입 정의
  result: number
}

export function calc${pascal}(input: ${pascal}Input): ${pascal}Result {
  // 유효하지 않은 입력에서 NaN/Infinity를 돌려주지 않도록 방어하세요.
  if (!Number.isFinite(input.value)) return { result: 0 }

  return { result: input.value }
}
`,

  'logic.spec.ts': `import { describe, expect, it } from 'vitest'
import { calc${pascal} } from './logic'

describe('calc${pascal}', () => {
  it('정상 입력을 계산한다', () => {
    expect(calc${pascal}({ value: 1 }).result).toBe(1)
  })

  it('경계값에서 NaN을 돌려주지 않는다', () => {
    expect(calc${pascal}({ value: 0 }).result).toBe(0)
    expect(calc${pascal}({ value: NaN }).result).toBe(0)
  })

  // TODO: 외부에서 검증된 값(엑셀·공식 문서 등)을 회귀 테스트로 고정하세요.
})
`,

  'View.vue': `<script setup lang="ts">
import { computed, reactive } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import NumberField from '@/components/ui/NumberField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import { useQuerySync } from '@/composables/useQuerySync'
import { formatNumber } from '@/utils/number'
import { calc${pascal} } from './logic'

const input = reactive({
  value: 1,
})

// 입력값을 URL 쿼리에 동기화해 결과를 링크로 공유할 수 있게 한다
useQuerySync(input)

const result = computed(() => calc${pascal}(input))
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <NumberField v-model="input.value" label="입력값" thousands :step="1" />
    </template>

    <template #result>
      <ResultCard label="결과" :value="formatNumber(result.result)" primary copyable />
    </template>

    <template #note>
      <FormulaNote>
        <p>TODO: 계산식과 참고사항을 적어주세요.</p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
`,
}

await mkdir(dir, { recursive: true })
for (const [name, content] of Object.entries(files)) {
  await writeFile(join(dir, name), content, 'utf8')
}

console.log(`
✔ src/tools/${id}/ 생성 완료

  meta.ts        도구 메타데이터 — description, keywords, icon 을 채우세요
  logic.ts       순수 계산 함수
  logic.spec.ts  단위 테스트
  View.vue       화면

다음 단계:
  npm run dev                          → http://localhost:5173/tools/${id}
  npm run test -- src/tools/${id}
`)
