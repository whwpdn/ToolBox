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
import {
  ACQUISITION_DISCLAIMER,
  HOUSE_COUNT_LABELS,
  RURAL_TAX_EXEMPT_AREA,
  calcAcquisitionTax,
  type HouseCount,
} from './logic'

const input = reactive({
  price: 500_000_000,
  areaM2: 84,
  houseCount: 'first' as HouseCount,
  regulated: 'no' as 'yes' | 'no',
})

useQuerySync(input)

const result = computed(() =>
  calcAcquisitionTax({
    price: input.price,
    areaM2: input.areaM2,
    houseCount: input.houseCount,
    regulated: input.regulated === 'yes',
  }),
)

const PRICE_PICKS: QuickPick[] = [
  { label: '1천만', value: 10_000_000 },
  { label: '1억', value: 100_000_000 },
  { label: '5억', value: 500_000_000 },
  { label: '10억', value: 1_000_000_000 },
]

const AREA_PICKS: QuickPick[] = [
  { label: '59㎡', value: 59 },
  { label: '84㎡', value: 84 },
  { label: '114㎡', value: 114 },
]

const MAX_PRICE = 100_000_000_000
const addPrice = (v: number) => (input.price = clamp(input.price + v, 0, MAX_PRICE))
const setArea = (v: number) => (input.areaM2 = clamp(v, 0, 1000))

const houseOptions = Object.entries(HOUSE_COUNT_LABELS).map(([value, label]) => ({ value, label }))

/** 평 환산은 면적 감을 잡는 데 도움이 된다 */
const pyeong = computed(() => (input.areaM2 * 121) / 400)
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <div>
        <NumberField
          v-model="input.price"
          label="취득가액 (매매가)"
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

      <div>
        <NumberField
          v-model="input.areaM2"
          label="전용면적"
          suffix="㎡"
          :step="1"
          :digits="2"
          :min="0"
          :max="1000"
          :hint="`약 ${pyeong.toFixed(1)}평`"
        />
        <QuickPicks
          class="mt-2"
          label="전용면적"
          :picks="AREA_PICKS"
          mode="set"
          :active="input.areaM2"
          @pick="setArea"
        />
        <p class="mt-1.5 text-xs text-muted">
          {{ RURAL_TAX_EXEMPT_AREA }}㎡ 이하면 농어촌특별세가 면제됩니다
        </p>
      </div>

      <SelectField
        v-model="input.houseCount"
        label="취득 후 보유 주택 수"
        :options="houseOptions"
      />

      <SelectField
        v-model="input.regulated"
        label="조정대상지역"
        :options="[
          { value: 'no', label: '비조정대상지역' },
          { value: 'yes', label: '조정대상지역' },
        ]"
      />
    </template>

    <template #result>
      <ResultCard
        label="취득세 총액"
        :value="formatWon(result.total)"
        :note="`실효세율 ${formatPercent(result.effectiveRate, 2)}${result.heavy ? ' · 중과 적용' : ''}`"
        primary
        copyable
      />

      <div class="overflow-hidden rounded-xl border border-line bg-surface">
        <ul>
          <li
            v-for="row in [
              {
                label: '취득세 본세',
                value: formatWon(result.baseTax),
                note: formatPercent(result.baseRate, 3),
              },
              { label: '지방교육세', value: formatWon(result.eduTax), note: '' },
              {
                label: '농어촌특별세',
                value: result.ruralExempt ? '면제' : formatWon(result.ruralTax),
                note: result.ruralExempt ? `${RURAL_TAX_EXEMPT_AREA}㎡ 이하` : '',
              },
            ]"
            :key="row.label"
            class="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5 text-sm last:border-0"
          >
            <span class="text-muted">
              {{ row.label }}
              <span v-if="row.note" class="ml-1 text-xs">({{ row.note }})</span>
            </span>
            <span class="tabular font-medium text-ink">{{ row.value }}</span>
          </li>
        </ul>
      </div>

      <ResultCard
        label="취득가 + 취득세"
        :value="formatWon(input.price + result.total)"
        note="실제로 준비해야 하는 금액 (중개보수·법무비 별도)"
      />

      <p
        v-if="result.heavy"
        class="rounded-xl border border-danger bg-surface p-4 text-sm text-danger"
      >
        다주택 중과세율 {{ formatPercent(result.baseRate, 0) }}가 적용됐습니다. 일시적 2주택 등
        특례에 해당하면 세율이 달라질 수 있습니다.
      </p>
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          <strong class="text-ink">취득세는 세 가지가 함께 붙습니다.</strong><br />
          <code>취득세 본세 + 지방교육세 + 농어촌특별세</code>
        </p>
        <p class="mb-2">
          <strong class="text-ink">기본 세율 (1주택)</strong><br />
          6억 이하 1% / 6억 초과 9억 이하는 1%에서 3%로 선형 증가 / 9억 초과 3%<br />
          중간 구간은 <code>(취득가(억) × 2/3 − 3) ÷ 100</code> 으로 계산합니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">중과세율</strong> — 조정대상지역 2주택 8%, 3주택 이상 12%.
          비조정대상지역은 3주택부터 8%입니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">농어촌특별세</strong>는 전용면적 {{ RURAL_TAX_EXEMPT_AREA }}㎡
          이하 국민주택이면 면제됩니다. 아파트 84㎡ 타입이 여기 해당해서 대부분 면제입니다.
        </p>
        <p class="text-xs">{{ ACQUISITION_DISCLAIMER }}</p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
