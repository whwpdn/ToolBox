<script setup lang="ts">
import { computed, reactive } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import NumberField from '@/components/ui/NumberField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import QuickPicks from '@/components/ui/QuickPicks.vue'
import type { Column, QuickPick } from '@/components/ui/types'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import { useQuerySync } from '@/composables/useQuerySync'
import { clamp, formatNumber, formatPercent } from '@/utils/number'
import { formatWon, formatWonKorean } from '@/utils/money'
import { FINANCE_DISCLAIMER } from '@/core/finance-policy'
import { REPAYMENT_LABELS, calcLoanRepayment, type RepaymentType } from './logic'

const input = reactive({
  principal: 300_000_000,
  annualRatePct: 4.2,
  months: 360,
  type: 'equal-total' as RepaymentType,
})

useQuerySync(input)

const result = computed(() =>
  calcLoanRepayment({
    principal: input.principal,
    annualRatePct: input.annualRatePct,
    months: input.months,
    type: input.type,
  }),
)

const typeOptions = Object.entries(REPAYMENT_LABELS).map(([value, label]) => ({ value, label }))

/** 대출 금액은 누르는 만큼 더해진다 (1억 + 5천만 = 1억 5천만) */
const AMOUNT_PICKS: QuickPick[] = [
  { label: '1백만', value: 1_000_000 },
  { label: '1천만', value: 10_000_000 },
  { label: '5천만', value: 50_000_000 },
  { label: '1억', value: 100_000_000 },
]

/** 상환 기간은 고르는 값이므로 치환한다 */
const TERM_PICKS: QuickPick[] = [
  { label: '5년', value: 60 },
  { label: '10년', value: 120 },
  { label: '20년', value: 240 },
  { label: '30년', value: 360 },
  { label: '40년', value: 480 },
]

/** NumberField 의 max(600개월)와 같은 상한을 적용해 입력 경로 간 동작을 맞춘다 */
const MAX_MONTHS = 600
const MAX_PRINCIPAL = 100_000_000_000

function addPrincipal(amount: number) {
  input.principal = clamp(input.principal + amount, 0, MAX_PRINCIPAL)
}

function setMonths(months: number) {
  input.months = clamp(months, 1, MAX_MONTHS)
}

const yearLabel = computed(() => {
  const y = Math.floor(input.months / 12)
  const m = input.months % 12
  return [y > 0 ? `${y}년` : '', m > 0 ? `${m}개월` : ''].filter(Boolean).join(' ') || '0개월'
})

const interestRatio = computed(() =>
  input.principal > 0 ? result.value.totalInterest / input.principal : 0,
)

const columns: Column[] = [
  { key: 'no', label: '회차', numeric: true },
  { key: 'payment', label: '상환액', numeric: true },
  { key: 'principal', label: '원금', numeric: true },
  { key: 'interest', label: '이자', numeric: true },
  { key: 'balance', label: '잔액', numeric: true },
]

const rows = computed(() =>
  result.value.schedule.map((r) => ({
    no: r.no,
    payment: formatNumber(r.payment),
    principal: formatNumber(r.principal),
    interest: formatNumber(r.interest),
    balance: formatNumber(r.balance),
  })),
)

/** 스케줄을 스프레드시트에 붙여넣을 수 있는 CSV로 */
const csv = computed(() => {
  const header = '회차,상환액,원금,이자,잔액'
  const body = result.value.schedule
    .map((r) => [r.no, r.payment, r.principal, r.interest, r.balance].join(','))
    .join('\n')
  return `${header}\n${body}`
})

const isEqualTotal = computed(() => input.type === 'equal-total')
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <div>
        <NumberField
          v-model="input.principal"
          label="대출 금액"
          suffix="원"
          thousands
          :step="10_000_000"
          :min="0"
          :hint="formatWonKorean(input.principal)"
        />
        <QuickPicks
          class="mt-2"
          :picks="AMOUNT_PICKS"
          mode="add"
          clearable
          @pick="addPrincipal"
          @clear="input.principal = 0"
        />
      </div>

      <NumberField
        v-model="input.annualRatePct"
        label="연 금리"
        suffix="%"
        :step="0.1"
        :digits="2"
        :min="0"
        :max="30"
      />

      <div>
        <NumberField
          v-model="input.months"
          label="상환 기간"
          suffix="개월"
          :step="12"
          :min="1"
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
      <SelectField v-model="input.type" label="상환 방식" :options="typeOptions" />
    </template>

    <template #result>
      <ResultCard
        :label="isEqualTotal ? '월 상환액' : '1회차 상환액'"
        :value="formatWon(result.firstPayment)"
        :note="
          isEqualTotal
            ? '매월 같은 금액을 상환합니다'
            : `마지막 회차 ${formatWon(result.lastPayment)}`
        "
        primary
        copyable
      />
      <div class="grid gap-3 sm:grid-cols-2">
        <ResultCard label="총이자" :value="formatWon(result.totalInterest)" />
        <ResultCard label="총상환액" :value="formatWon(result.totalPayment)" />
      </div>
      <ResultCard
        label="원금 대비 이자 비율"
        :value="formatPercent(interestRatio, 1)"
        :note="`대출금 ${formatWonKorean(input.principal)}원 기준`"
      />
    </template>

    <template #extra>
      <div class="mb-3 flex items-baseline justify-between gap-2">
        <h2 class="text-sm font-semibold text-ink">회차별 상환 스케줄</h2>
        <CopyButton :text="csv" label="CSV 복사" />
      </div>
      <DataTable :columns="columns" :rows="rows" />
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          <strong class="text-ink">원리금균등상환</strong> — 매월 같은 금액을 상환합니다.<br />
          <code>M = P × i × (1+i)^n ÷ ((1+i)^n − 1)</code><br />
          P = 대출원금, i = 월이율(연이율÷12), n = 총 상환 회차
        </p>
        <p class="mb-2">
          <strong class="text-ink">원금균등상환</strong> — 매월 원금을 <code>P÷n</code> 씩 같게
          갚고, 이자는 남은 잔액에 대해 계산합니다. 초기 부담이 크지만 총이자가 가장 적습니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">만기일시상환</strong> — 기간 중에는 이자만 내고 만기에 원금을
          전액 상환합니다. 총이자가 가장 많습니다.
        </p>
        <p class="mb-2">
          각 회차 금액은 원 단위로 반올림하고, 마지막 회차에서 잔액을 정산해 원금 합계가 대출금과
          정확히 일치하도록 계산합니다.
        </p>
        <p class="text-xs">{{ FINANCE_DISCLAIMER }}</p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
