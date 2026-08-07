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
import { BROKERAGE_DISCLAIMER, DEAL_TYPE_LABELS, calcBrokerageFee, type DealType } from './logic'

const input = reactive({
  dealType: 'sale' as DealType,
  price: 500_000_000,
  monthlyRent: 0,
  vat: 'no' as 'yes' | 'no',
})

useQuerySync(input)

const result = computed(() =>
  calcBrokerageFee({
    dealType: input.dealType,
    price: input.price,
    monthlyRent: input.monthlyRent,
    includeVat: input.vat === 'yes',
  }),
)

const isLease = computed(() => input.dealType === 'lease')

const PRICE_PICKS: QuickPick[] = [
  { label: '1천만', value: 10_000_000 },
  { label: '1억', value: 100_000_000 },
  { label: '5억', value: 500_000_000 },
  { label: '10억', value: 1_000_000_000 },
]

const RENT_PICKS: QuickPick[] = [
  { label: '10만', value: 100_000 },
  { label: '50만', value: 500_000 },
  { label: '100만', value: 1_000_000 },
]

const MAX = 100_000_000_000
const addPrice = (v: number) => (input.price = clamp(input.price + v, 0, MAX))
const addRent = (v: number) => (input.monthlyRent = clamp(input.monthlyRent + v, 0, MAX))

const dealOptions = Object.entries(DEAL_TYPE_LABELS).map(([value, label]) => ({ value, label }))
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <SelectField v-model="input.dealType" label="거래 종류" :options="dealOptions" />

      <div>
        <NumberField
          v-model="input.price"
          :label="isLease ? '보증금' : '매매가'"
          suffix="원"
          thousands
          :step="10_000_000"
          :min="0"
          :hint="formatWonKorean(input.price)"
        />
        <QuickPicks
          class="mt-2"
          :picks="PRICE_PICKS"
          mode="add"
          clearable
          @pick="addPrice"
          @clear="input.price = 0"
        />
      </div>

      <div v-if="isLease">
        <NumberField
          v-model="input.monthlyRent"
          label="월세 (전세면 0)"
          suffix="원"
          thousands
          :step="100_000"
          :min="0"
          :hint="input.monthlyRent > 0 ? formatWonKorean(input.monthlyRent) : '전세'"
        />
        <QuickPicks
          class="mt-2"
          :picks="RENT_PICKS"
          mode="add"
          clearable
          @pick="addRent"
          @clear="input.monthlyRent = 0"
        />
      </div>

      <SelectField
        v-model="input.vat"
        label="부가세"
        :options="[
          { value: 'no', label: '부가세 제외' },
          { value: 'yes', label: '부가세 10% 포함 (일반과세자)' },
        ]"
      />
    </template>

    <template #result>
      <ResultCard
        label="중개보수 상한"
        :value="formatWon(result.total)"
        :note="
          result.capped
            ? `한도액 ${formatWon(result.cap ?? 0)} 적용`
            : `${result.bracketLabel} · 상한요율 ${formatPercent(result.rate, 1)}`
        "
        primary
        copyable
      />

      <div class="grid gap-3 sm:grid-cols-2">
        <ResultCard label="중개보수" :value="formatWon(result.fee)" />
        <ResultCard
          label="부가세"
          :value="input.vat === 'yes' ? formatWon(result.vat) : '해당 없음'"
          :note="input.vat === 'yes' ? '10%' : '간이과세자·비사업자'"
        />
      </div>

      <ResultCard
        v-if="result.converted"
        label="환산보증금"
        :value="formatWon(result.dealAmount)"
        :note="`보증금 + 월세 × ${result.multiplier} — 이 금액으로 요율 구간을 정합니다`"
      />

      <div class="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
        <p>
          법에 정해진 것은 <strong class="text-ink">상한</strong>이지 정가가 아닙니다. 실제 보수는
          이 금액 안에서 협의로 정하며, 매도인·매수인이 <strong class="text-ink">각각</strong>
          부담합니다.
        </p>
      </div>
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          <strong class="text-ink">매매 상한요율</strong><br />
          5천만 미만 0.6%(한도 25만) / 5천만~2억 0.5%(한도 80만) / 2억~9억 0.4% / 9억~12억 0.5% /
          12억~15억 0.6% / 15억 이상 0.7%
        </p>
        <p class="mb-2">
          <strong class="text-ink">임대차 상한요율</strong><br />
          5천만 미만 0.5%(한도 20만) / 5천만~1억 0.4%(한도 30만) / 1억~6억 0.3% / 6억~12억 0.4% /
          12억~15억 0.5% / 15억 이상 0.6%
        </p>
        <p class="mb-2">
          <strong class="text-ink">한도액</strong>이 있는 저가 구간에서는
          <code>거래금액 × 요율</code> 과 한도액 중 <strong class="text-ink">작은 쪽</strong>이
          상한입니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">월세 환산</strong> —
          <code>환산보증금 = 보증금 + 월세 × 100</code>. 다만 그 값이 5천만원 미만이면 배수를 70으로
          낮춰 다시 계산합니다. 소액 월세 거래에서 보수가 과도해지지 않게 하는 장치입니다.
        </p>
        <p class="text-xs">{{ BROKERAGE_DISCLAIMER }}</p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
