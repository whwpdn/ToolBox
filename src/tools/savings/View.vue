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
import { clamp, formatPercent } from '@/utils/number'
import { formatWon, formatWonKorean } from '@/utils/money'
import { INTEREST_TAX_RATE } from '@/core/finance-policy'
import {
  INTEREST_LABELS,
  KIND_LABELS,
  calcSavings,
  type SavingsInterest,
  type SavingsKind,
} from './logic'

const input = reactive({
  kind: 'installment' as SavingsKind,
  amount: 500_000,
  annualRatePct: 3.5,
  months: 12,
  interest: 'simple' as SavingsInterest,
  taxed: true,
})

useQuerySync(input)

const result = computed(() =>
  calcSavings({
    kind: input.kind,
    amount: input.amount,
    annualRatePct: input.annualRatePct,
    months: input.months,
    interest: input.interest,
    taxed: input.taxed,
  }),
)

const isInstallment = computed(() => input.kind === 'installment')

/** 적금은 월 납입액이라 단위가 작고, 예금은 목돈이라 크다 */
const amountPicks = computed<QuickPick[]>(() =>
  isInstallment.value
    ? [
        { label: '10만', value: 100_000 },
        { label: '30만', value: 300_000 },
        { label: '50만', value: 500_000 },
        { label: '100만', value: 1_000_000 },
      ]
    : [
        { label: '100만', value: 1_000_000 },
        { label: '1천만', value: 10_000_000 },
        { label: '5천만', value: 50_000_000 },
        { label: '1억', value: 100_000_000 },
      ],
)

const TERM_PICKS: QuickPick[] = [
  { label: '6개월', value: 6 },
  { label: '1년', value: 12 },
  { label: '2년', value: 24 },
  { label: '3년', value: 36 },
  { label: '5년', value: 60 },
]

const MAX_AMOUNT = 100_000_000_000
const MAX_MONTHS = 600

const addAmount = (v: number) => (input.amount = clamp(input.amount + v, 0, MAX_AMOUNT))
const setMonths = (v: number) => (input.months = clamp(v, 0, MAX_MONTHS))

const kindOptions = Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label }))
const interestOptions = Object.entries(INTEREST_LABELS).map(([value, label]) => ({ value, label }))

const taxedModel = computed({
  get: () => (input.taxed ? 'taxed' : 'free'),
  set: (v: string) => (input.taxed = v === 'taxed'),
})

const yearLabel = computed(() => {
  const y = Math.floor(input.months / 12)
  const m = input.months % 12
  return [y > 0 ? `${y}년` : '', m > 0 ? `${m}개월` : ''].filter(Boolean).join(' ') || '0개월'
})

/** 표면 금리와 실효 수익률의 차이 — 적금에서 가장 오해가 많은 지점 */
const rateGap = computed(() => input.annualRatePct - result.value.effectiveAnnualRatePct)
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <SelectField v-model="input.kind" label="상품 종류" :options="kindOptions" />

      <div>
        <NumberField
          v-model="input.amount"
          :label="isInstallment ? '월 납입액' : '예치금'"
          suffix="원"
          thousands
          :step="isInstallment ? 100_000 : 1_000_000"
          :min="0"
          :hint="formatWonKorean(input.amount)"
        />
        <QuickPicks
          class="mt-2"
          :picks="amountPicks"
          mode="add"
          clearable
          @pick="addAmount"
          @clear="input.amount = 0"
        />
      </div>

      <NumberField
        v-model="input.annualRatePct"
        label="연 이율 (세전)"
        suffix="%"
        :step="0.1"
        :digits="2"
        :min="0"
        :max="20"
      />

      <div>
        <NumberField
          v-model="input.months"
          label="기간"
          suffix="개월"
          :step="6"
          :min="0"
          :max="600"
          :hint="yearLabel"
        />
        <QuickPicks
          class="mt-2"
          :picks="TERM_PICKS"
          mode="set"
          :active="input.months"
          @pick="setMonths"
        />
      </div>

      <SelectField v-model="input.interest" label="이자 방식" :options="interestOptions" />
      <SelectField
        v-model="taxedModel"
        label="세금"
        :options="[
          { value: 'taxed', label: '이자소득세 15.4% 적용' },
          { value: 'free', label: '비과세 · 세금우대' },
        ]"
      />
    </template>

    <template #result>
      <ResultCard
        label="만기 수령액"
        :value="formatWon(result.total)"
        :note="`납입 원금 ${formatWon(result.principal)} + 세후 이자 ${formatWon(result.netInterest)}`"
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
        label="납입 원금"
        :value="formatWon(result.principal)"
        :note="isInstallment ? `월 ${formatWon(input.amount)} × ${input.months}회` : '한 번에 예치'"
      />

      <ResultCard
        label="실효 연수익률 (세전)"
        :value="formatPercent(result.effectiveAnnualRatePct / 100, 2)"
        :note="
          isInstallment && rateGap > 0.01
            ? `표면 금리 ${input.annualRatePct}%보다 낮습니다 — 매월 납입해서 평균 예치 기간이 짧기 때문`
            : `표면 금리 ${input.annualRatePct}% 기준`
        "
      />
    </template>

    <template #note>
      <FormulaNote :open="isInstallment">
        <p class="mb-2">
          <strong class="text-ink">적금이 예금보다 이자가 적은 이유</strong><br />
          적금은 매월 나눠 넣으므로 첫 회차만 전 기간 예치되고 마지막 회차는 거의 예치되지 않습니다.
          평균 예치 기간이 절반 남짓이라, 같은 금리라도 이자는 예금의 절반 정도입니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">적금 단리</strong> — <code>월납입액 × 월이율 × n(n+1)/2</code
          ><br />
          은행 적금의 표준 계산식입니다. 월 50만원·연 4%·12개월이면
          <code>500,000 × (0.04÷12) × 78 = 130,000원</code>
        </p>
        <p class="mb-2">
          <strong class="text-ink">예금 단리</strong> — <code>예치금 × 연이율 × 연수</code><br />
          <strong class="text-ink">월복리</strong> — 매월 이자가 원금에 더해져 다시 이자를 낳습니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">실효 연수익률</strong> —
          <code>세전 이자 ÷ 납입 원금 ÷ 연수</code>. 광고에 적힌 금리와 실제 수익률을 비교할 때
          쓰세요. 예금은 표면 금리와 같지만, 적금은 절반 수준으로 나옵니다.
        </p>
        <p>
          단리·복리 모두 매월 초 납입(기초 납입)을 가정합니다. 실제 상품은 일수 기준으로 이자를
          산정하므로 은행 계산기와 몇 원 차이가 날 수 있습니다.
        </p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
