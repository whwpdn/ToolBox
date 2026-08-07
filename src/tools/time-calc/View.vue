<script setup lang="ts">
import { computed, reactive } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import NumberField from '@/components/ui/NumberField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import { useQuerySync } from '@/composables/useQuerySync'
import { formatNumber, round } from '@/utils/number'
import { calcTime, describe, toSeconds, type TimeOp } from './logic'

const input = reactive({
  h1: 1,
  m1: 30,
  s1: 0,
  h2: 0,
  m2: 45,
  s2: 0,
  op: 'add' as TimeOp,
})

useQuerySync(input)

const a = computed(() => ({ hours: input.h1, minutes: input.m1, seconds: input.s1 }))
const b = computed(() => ({ hours: input.h2, minutes: input.m2, seconds: input.s2 }))

const result = computed(() => calcTime(a.value, b.value, input.op))

/** 각 항을 단독으로도 환산해서 보여준다 (단위 변환처럼 쓰는 경우) */
const firstOnly = computed(() => describe(toSeconds(a.value)))

function swap() {
  const [h, m, s] = [input.h1, input.m1, input.s1]
  input.h1 = input.h2
  input.m1 = input.m2
  input.s1 = input.s2
  input.h2 = h
  input.m2 = m
  input.s2 = s
}
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <div class="rounded-xl border border-line bg-surface p-4">
        <p class="mb-3 text-sm font-medium text-ink">첫 번째 시간</p>
        <div class="grid grid-cols-3 gap-2">
          <NumberField v-model="input.h1" label="시" suffix="h" align="center" stepper :step="1" />
          <NumberField v-model="input.m1" label="분" suffix="m" align="center" stepper :step="1" />
          <NumberField v-model="input.s1" label="초" suffix="s" align="center" stepper :step="1" />
        </div>
        <p class="mt-2 text-xs text-muted">
          = {{ firstOnly.label }} ({{ formatNumber(firstOnly.totalSeconds) }}초)
        </p>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex flex-1 overflow-hidden rounded-lg border border-line">
          <button
            v-for="op in ['add', 'subtract'] as TimeOp[]"
            :key="op"
            type="button"
            class="flex-1 py-2 text-sm transition-colors"
            :class="
              input.op === op ? 'bg-brand text-brand-ink' : 'bg-surface text-muted hover:text-ink'
            "
            :aria-pressed="input.op === op"
            @click="input.op = op"
          >
            {{ op === 'add' ? '＋ 더하기' : '− 빼기' }}
          </button>
        </div>
        <button
          type="button"
          class="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted transition-colors hover:border-brand hover:text-brand"
          @click="swap"
        >
          위아래 바꾸기
        </button>
      </div>

      <div class="rounded-xl border border-line bg-surface p-4">
        <p class="mb-3 text-sm font-medium text-ink">두 번째 시간</p>
        <div class="grid grid-cols-3 gap-2">
          <NumberField v-model="input.h2" label="시" suffix="h" align="center" stepper :step="1" />
          <NumberField v-model="input.m2" label="분" suffix="m" align="center" stepper :step="1" />
          <NumberField v-model="input.s2" label="초" suffix="s" align="center" stepper :step="1" />
        </div>
      </div>
    </template>

    <template #result>
      <ResultCard label="결과" :value="result.label" :note="result.clock" primary copyable />

      <div class="grid gap-3 sm:grid-cols-2">
        <ResultCard
          label="총 초"
          :value="`${formatNumber(result.totalSeconds)}초`"
          note="모든 계산의 기준"
        />
        <ResultCard label="시계 형식" :value="result.clock" note="HH:MM:SS" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <ResultCard
          label="소수 시간"
          :value="`${round(result.decimalHours, 4)}시간`"
          note="급여·공수 계산용"
        />
        <ResultCard label="소수 분" :value="`${round(result.decimalMinutes, 3)}분`" />
      </div>
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          시간은 60진법이라 일반 계산기로 더하면 틀립니다. 1시간 30분 + 45분을 소수로 바꿔
          <code>1.5 + 0.75 = 2.25</code> 로 계산하면 2시간 15분이 아니라 2시간 25분처럼 읽게 됩니다.
        </p>
        <p class="mb-2">
          이 도구는 모든 값을 <strong class="text-ink">초로 환산해 계산한 뒤</strong> 다시
          시·분·초로 풀어냅니다. 분·초에 60을 넘는 값을 넣어도 됩니다 (90분 = 1시간 30분).
        </p>
        <p class="mb-2">
          <strong class="text-ink">소수 시간</strong>은 급여나 공수를 계산할 때 씁니다. 1시간 30분은
          1.5시간입니다. 시급 계산은 이 값에 시급을 곱하면 됩니다.
        </p>
        <p>결과가 음수면 부호를 앞에 붙여 표시합니다 (<code>-30분</code>).</p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
