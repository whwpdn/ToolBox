<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import { formatSignificant } from '@/utils/number'
import { evaluate, type AngleMode } from '@/core/expression'

interface HistoryRow {
  expression: string
  result: string
  angle: AngleMode
}

const expression = ref('')
const angle = ref<AngleMode>('deg')
const history = ref<HistoryRow[]>([])
const inputEl = ref<HTMLInputElement>()

const evaluated = computed(() => evaluate(expression.value, { angle: angle.value }))
const preview = computed(() =>
  evaluated.value.value === null ? '' : formatSignificant(evaluated.value.value, 12),
)

/**
 * 함수 버튼은 '이름(' 까지 넣는다. 괄호를 직접 치게 하면 닫는 괄호를 빠뜨리기 쉽다.
 */
const FUNC_KEYS = [
  ['sin(', 'cos(', 'tan(', 'π'],
  ['asin(', 'acos(', 'atan(', 'e'],
  ['ln(', 'log(', 'log2(', '^'],
  ['sqrt(', 'cbrt(', 'abs(', '!'],
] as const

const NUM_KEYS = [
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
    {
      expression: expression.value,
      result: formatSignificant(value, 12),
      angle: angle.value,
    },
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
  if (/^[0-9.+\-*/()%^!]$/.test(event.key)) {
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
        <div class="mb-1 flex items-center justify-between">
          <!-- 각도 모드는 결과를 완전히 바꾸므로 항상 보이게 둔다 -->
          <div class="flex overflow-hidden rounded-lg border border-line text-xs">
            <button
              v-for="mode in ['deg', 'rad'] as AngleMode[]"
              :key="mode"
              type="button"
              class="px-2.5 py-1 transition-colors"
              :class="
                angle === mode ? 'bg-brand text-brand-ink' : 'bg-surface text-muted hover:text-ink'
              "
              :aria-pressed="angle === mode"
              @click="angle = mode"
            >
              {{ mode === 'deg' ? '도(DEG)' : '라디안(RAD)' }}
            </button>
          </div>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-xs text-muted hover:text-danger"
            @click="backspace"
          >
            ← 지우기
          </button>
        </div>

        <input
          ref="inputEl"
          v-model="expression"
          type="text"
          placeholder="예: sin(30)^2 + cos(30)^2"
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
        <template v-for="row in FUNC_KEYS" :key="row[0]">
          <button
            v-for="key in row"
            :key="key"
            type="button"
            class="rounded-lg border border-line bg-surface-hover py-2.5 text-sm font-medium text-brand transition-colors hover:bg-surface"
            @click="append(key)"
          >
            {{ key.endsWith('(') ? key.slice(0, -1) : key }}
          </button>
        </template>
      </div>

      <div class="grid grid-cols-4 gap-2">
        <template v-for="row in NUM_KEYS" :key="row[0]">
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

        <ul v-if="history.length" class="max-h-[32rem] overflow-y-auto">
          <li
            v-for="(row, i) in history"
            :key="i"
            class="flex items-baseline justify-between gap-2 border-b border-line px-4 py-2.5 text-sm last:border-0"
          >
            <button
              type="button"
              class="tabular min-w-0 flex-1 truncate text-left text-muted hover:text-brand"
              title="클릭하면 수식을 다시 불러옵니다"
              @click="expression = row.expression"
            >
              {{ row.expression }}
            </button>
            <!-- 같은 식이라도 각도 모드에 따라 값이 달라지므로 함께 기록한다 -->
            <span class="shrink-0 text-xs text-muted uppercase">{{ row.angle }}</span>
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
          <strong class="text-ink">각도 모드</strong> — 삼각함수의 인자 단위입니다. DEG에서
          <code>sin(30)</code> 은 0.5, RAD에서는 -0.988 입니다. 값이 완전히 달라지므로 계산 전에
          모드를 확인하세요. 역삼각함수(<code>asin</code> 등)의 결과 단위도 함께 바뀝니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">사용 가능한 함수</strong><br />
          <code>sin cos tan asin acos atan sinh cosh tanh</code><br />
          <code>ln log log2 exp sqrt cbrt abs round floor ceil sign</code>
        </p>
        <p class="mb-2">
          <strong class="text-ink">연산자</strong> — <code>^</code> 거듭제곱(우결합, 2^3^2 = 2^9),
          <code>!</code> 팩토리얼, <code>%</code> 백분율. 상수 <code>pi</code>(π)와
          <code>e</code> 를 쓸 수 있습니다.
        </p>
        <p class="mb-2">
          <code>-2^2</code> 는 <code>-(2^2) = -4</code> 입니다. 거듭제곱이 부호보다 먼저 계산됩니다.
        </p>
        <p>
          수식은 자체 파서로 계산합니다. <code>eval()</code> 을 쓰지 않으므로 입력한 문자열이 코드로
          실행될 여지가 없습니다. <code>tan(90°)</code> 처럼 정의되지 않는 값은 거대한 수 대신 안내
          문구를 보여줍니다.
        </p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
