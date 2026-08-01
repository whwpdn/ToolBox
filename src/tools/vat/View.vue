<script setup lang="ts">
import { computed, reactive } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import NumberField from '@/components/ui/NumberField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import QuickPicks from '@/components/ui/QuickPicks.vue'
import type { QuickPick } from '@/components/ui/types'
import { useQuerySync } from '@/composables/useQuerySync'
import { clamp } from '@/utils/number'
import { formatWon, formatWonKorean } from '@/utils/money'
import { VAT_RATE } from '@/core/finance-policy'
import { BASE_LABELS, calcVat, type VatBase } from './logic'

const input = reactive({
  amount: 1_000_000,
  base: 'supply' as VatBase,
})

useQuerySync(input)

const result = computed(() => calcVat(input.amount, input.base))

const baseOptions = Object.entries(BASE_LABELS).map(([value, label]) => ({ value, label }))

const AMOUNT_PICKS: QuickPick[] = [
  { label: '1만', value: 10_000 },
  { label: '10만', value: 100_000 },
  { label: '100만', value: 1_000_000 },
  { label: '1천만', value: 10_000_000 },
]

const MAX_AMOUNT = 100_000_000_000
const addAmount = (v: number) => (input.amount = clamp(input.amount + v, 0, MAX_AMOUNT))

const isSupplyBase = computed(() => input.base === 'supply')
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <SelectField v-model="input.base" label="입력한 금액의 종류" :options="baseOptions" />

      <div>
        <NumberField
          v-model="input.amount"
          :label="isSupplyBase ? '공급가액' : '합계 금액'"
          suffix="원"
          thousands
          :step="100_000"
          :min="0"
          :hint="formatWonKorean(input.amount)"
        />
        <QuickPicks
          class="mt-2"
          :picks="AMOUNT_PICKS"
          mode="add"
          clearable
          @pick="addAmount"
          @clear="input.amount = 0"
        />
      </div>

      <div class="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
        <p>
          세금계산서에서 <strong class="text-ink">공급가액</strong>은 부가세를 뺀 금액,
          <strong class="text-ink">합계 금액</strong>은 부가세를 포함해 실제로 주고받는 금액입니다.
        </p>
      </div>
    </template>

    <template #result>
      <ResultCard
        :label="isSupplyBase ? '합계 금액 (부가세 포함)' : '공급가액 (부가세 제외)'"
        :value="formatWon(isSupplyBase ? result.total : result.supply)"
        primary
        copyable
      />

      <div class="grid gap-3 sm:grid-cols-2">
        <ResultCard label="공급가액" :value="formatWon(result.supply)" />
        <ResultCard label="부가세" :value="formatWon(result.vat)" note="세율 10%" />
      </div>

      <ResultCard
        label="합계 금액"
        :value="formatWon(result.total)"
        note="공급가액 + 부가세"
        copyable
      />
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          <strong class="text-ink">공급가액을 알 때</strong><br />
          <code>부가세 = 공급가액 × 10%</code>, <code>합계 = 공급가액 × 1.1</code>
        </p>
        <p class="mb-2">
          <strong class="text-ink">합계 금액을 알 때 (역산)</strong><br />
          <code>공급가액 = 합계 ÷ 1.1</code>, <code>부가세 = 합계 − 공급가액</code>
        </p>
        <p class="mb-2">
          <strong class="text-ink">흔한 실수</strong> — 합계 금액에 10%를 곱하면 안 됩니다. 11만원의
          부가세는 1.1만원이 아니라 <strong class="text-ink">1만원</strong>입니다. 부가세는 공급가액
          기준으로 붙기 때문입니다.
        </p>
        <p>
          원 단위 미만은 반올림하며, 반올림 오차가 남지 않도록 역산 시 부가세를 차액으로 확정합니다
          (공급가액 + 부가세 = 합계가 항상 성립). 현재 세율은
          <code>{{ VAT_RATE * 100 }}%</code> 입니다.
        </p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
