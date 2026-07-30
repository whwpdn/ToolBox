<script setup lang="ts">
import { computed, reactive } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import NumberField from '@/components/ui/NumberField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import type { Column } from '@/components/ui/types'
import { useQuerySync } from '@/composables/useQuerySync'
import { formatNumber, formatPercent } from '@/utils/number'
import { formatWon, formatWonKorean } from '@/utils/money'
import { INTEREST_TAX_RATE } from '@/core/finance-policy'
import {
  FREQUENCY_LABELS,
  KIND_LABELS,
  calcInterest,
  type CompoundFrequency,
  type InterestKind,
} from './logic'

const input = reactive({
  principal: 10_000_000,
  annualRatePct: 3.5,
  months: 12,
  kind: 'compound' as InterestKind,
  frequency: 12 as CompoundFrequency,
  taxed: true,
})

useQuerySync(input)

const result = computed(() =>
  calcInterest({
    principal: input.principal,
    annualRatePct: input.annualRatePct,
    months: input.months,
    kind: input.kind,
    frequency: Number(input.frequency) as CompoundFrequency,
    taxed: input.taxed,
  }),
)

const kindOptions = Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label }))
const frequencyOptions = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const frequencyModel = computed({
  get: () => String(input.frequency),
  set: (v: string) => (input.frequency = Number(v) as CompoundFrequency),
})

const taxedModel = computed({
  get: () => (input.taxed ? 'taxed' : 'free'),
  set: (v: string) => (input.taxed = v === 'taxed'),
})

const yearLabel = computed(() => {
  const y = Math.floor(input.months / 12)
  const m = input.months % 12
  return [y > 0 ? `${y}년` : '', m > 0 ? `${m}개월` : ''].filter(Boolean).join(' ') || '0개월'
})

const columns: Column[] = [
  { key: 'year', label: '경과', numeric: true },
  { key: 'interest', label: '누적 이자 (세전)', numeric: true },
  { key: 'balance', label: '잔액 (세전)', numeric: true },
]

const rows = computed(() =>
  result.value.yearly.map((r) => ({
    year: `${r.year}년`,
    interest: formatNumber(r.interest),
    balance: formatNumber(r.balance),
  })),
)
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <NumberField
        v-model="input.principal"
        label="원금"
        suffix="원"
        thousands
        :step="1_000_000"
        :min="0"
        :hint="formatWonKorean(input.principal)"
      />
      <NumberField
        v-model="input.annualRatePct"
        label="연 이율"
        suffix="%"
        :step="0.1"
        :digits="2"
        :min="0"
        :max="100"
      />
      <NumberField
        v-model="input.months"
        label="예치 기간"
        suffix="개월"
        :step="6"
        :min="0"
        :max="600"
        :hint="yearLabel"
      />
      <SelectField v-model="input.kind" label="이자 방식" :options="kindOptions" />
      <SelectField
        v-if="input.kind === 'compound'"
        v-model="frequencyModel"
        label="복리 주기"
        :options="frequencyOptions"
      />
      <SelectField
        v-model="taxedModel"
        label="세금"
        :options="[
          { value: 'taxed', label: '이자소득세 15.4% 적용' },
          { value: 'free', label: '비과세' },
        ]"
      />
    </template>

    <template #result>
      <ResultCard
        label="만기 수령액"
        :value="formatWon(result.total)"
        :note="`원금 ${formatWon(input.principal)} + 세후 이자 ${formatWon(result.netInterest)}`"
        primary
        copyable
      />
      <div class="grid gap-3 sm:grid-cols-2">
        <ResultCard label="세전 이자" :value="formatWon(result.interest)" />
        <ResultCard
          label="이자소득세"
          :value="formatWon(result.tax)"
          :note="input.taxed ? `세율 ${formatPercent(INTEREST_TAX_RATE, 1)}` : '비과세'"
        />
      </div>
      <ResultCard
        label="세후 수익률"
        :value="formatPercent(result.returnRate, 2)"
        :note="`${yearLabel} 기준 누적 수익률`"
      />
    </template>

    <template #extra>
      <div v-if="rows.length">
        <h2 class="mb-3 text-sm font-semibold text-ink">연도별 추이</h2>
        <DataTable :columns="columns" :rows="rows" max-height="20rem" />
      </div>
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          <strong class="text-ink">단리</strong> — 원금에만 이자가 붙습니다.<br />
          <code>A = P × (1 + r × t)</code>
        </p>
        <p class="mb-2">
          <strong class="text-ink">복리</strong> — 이자에도 이자가 붙습니다.<br />
          <code>A = P × (1 + r ÷ n)^(n × t)</code><br />
          P = 원금, r = 연이율, t = 연 단위 기간, n = 연간 복리 횟수
        </p>
        <p class="mb-2">
          <strong class="text-ink">이자소득세</strong> — 소득세 14% + 지방소득세 1.4% = 15.4%가
          이자에 부과됩니다. 세금우대·비과세 상품이라면 '비과세'를 선택하세요.
        </p>
        <p>
          은행 예금은 보통 단리 또는 월복리로 계산하며, 실제 상품은 일수 기준(365일 일할)으로 이자를
          산정하므로 실제 수령액과 몇 원 차이가 날 수 있습니다.
        </p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
