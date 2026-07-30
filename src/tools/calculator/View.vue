<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import { formatSignificant } from '@/utils/number'

import { evaluate } from './logic'

interface HistoryRow {
  expression: string
  result: string
}

const expression = ref('')
const history = ref<HistoryRow[]>([])
const inputEl = ref<HTMLInputElement>()

const evaluated = computed(() => evaluate(expression.value))
const preview = computed(() =>
  evaluated.value.value === null ? '' : formatSignificant(evaluated.value.value, 12),
)

const KEYS = [
  ['(', ')', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', 'C', '='],
] as const

function append(key: string) {
  expression.value += key
  inputEl.value?.focus()
}

function clearAll() {
  expression.value = ''
  inputEl.value?.focus()
}

function backspace() {
  expression.value = expression.value.slice(0, -1)
}

function submit() {
  const { value } = evaluated.value
  if (value === null) return
  history.value = [
    { expression: expression.value, result: formatSignificant(value, 12) },
    ...history.value,
  ].slice(0, 20)
  // 이어서 계산할 수 있도록 결과를 입력창에 남긴다
  expression.value = String(value)
}

function onKey(key: string) {
  if (key === '=') submit()
  else if (key === 'C') clearAll()
  else append(key)
}

/** 계산기 페이지에서는 숫자·연산자 키를 바로 받는다 */
function onGlobalKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (target?.tagName === 'INPUT') return // 입력창에 포커스가 있으면 브라우저 기본 동작
  if (/^[0-9.+\-*/()%]$/.test(event.key)) {
    append(event.key)
    event.preventDefault()
  } else if (event.key === 'Enter') {
    submit()
  } else if (event.key === 'Escape') {
    clearAll()
  } else if (event.key === 'Backspace') {
    backspace()
    event.preventDefault()
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeydown))
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <div class="rounded-xl border border-line bg-surface p-4">
        <input
          ref="inputEl"
          v-model="expression"
          type="text"
          inputmode="text"
          placeholder="예: (1200+800)*15%"
          aria-label="수식"
          class="tabular w-full bg-transparent py-2 text-right text-2xl outline-none placeholder:text-base placeholder:text-muted"
          @keydown.enter.prevent="submit"
          @keydown.esc.prevent="clearAll"
        />
        <div class="tabular flex min-h-7 items-baseline justify-end gap-2 text-right">
          <span v-if="evaluated.error" class="text-sm text-danger">{{ evaluated.error }}</span>
          <span v-else-if="preview" class="text-lg font-semibold text-brand">= {{ preview }}</span>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-2">
        <template v-for="row in KEYS" :key="row[0]">
          <button
            v-for="key in row"
            :key="key"
            type="button"
            class="rounded-lg border py-3.5 text-lg font-medium transition-colors"
            :class="
              key === '='
                ? 'border-brand bg-brand text-brand-ink'
                : key === 'C'
                  ? 'border-line bg-surface text-danger hover:bg-surface-hover'
                  : /[0-9.]/.test(key)
                    ? 'border-line bg-surface text-ink hover:bg-surface-hover'
                    : 'border-line bg-surface-hover text-brand hover:bg-surface'
            "
            @click="onKey(key)"
          >
            {{ key }}
          </button>
        </template>
      </div>

      <button
        type="button"
        class="w-full rounded-lg border border-line bg-surface py-2.5 text-sm text-muted hover:bg-surface-hover"
        @click="backspace"
      >
        ← 한 글자 지우기 (Backspace)
      </button>
    </template>

    <template #result>
      <div class="rounded-xl border border-line bg-surface">
        <div class="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span class="text-sm font-medium text-ink">계산 이력</span>
          <button
            v-if="history.length"
            type="button"
            class="text-xs text-muted hover:text-danger"
            @click="history = []"
          >
            전체 삭제
          </button>
        </div>

        <ul v-if="history.length" class="max-h-96 overflow-y-auto">
          <li
            v-for="(row, i) in history"
            :key="i"
            class="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5 text-sm last:border-0"
          >
            <button
              type="button"
              class="tabular min-w-0 flex-1 truncate text-left text-muted hover:text-brand"
              title="클릭하면 수식을 다시 불러옵니다"
              @click="expression = row.expression"
            >
              {{ row.expression }}
            </button>
            <span class="tabular shrink-0 font-medium text-ink">{{ row.result }}</span>
            <CopyButton :text="row.result" label="" />
          </li>
        </ul>
        <p v-else class="px-4 py-8 text-center text-sm text-muted">
          Enter 또는 = 를 누르면 이력이 쌓입니다
        </p>
      </div>
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          <strong class="text-ink">키보드</strong> — 숫자와 <code>+ - * / ( ) %</code> 를 바로
          입력할 수 있습니다. Enter는 계산, Esc는 초기화, Backspace는 한 글자 삭제입니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">백분율</strong> — 숫자 뒤의 <code>%</code> 는 100으로 나눕니다.
          <code>200*10%</code> = 20, <code>50%</code> = 0.5
        </p>
        <p>
          수식은 자체 파서로 계산합니다. <code>eval()</code> 을 쓰지 않으므로 입력한 문자열이 코드로
          실행될 여지가 없습니다.
        </p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
