<script setup lang="ts">
import { computed, reactive } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import NumberField from '@/components/ui/NumberField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import { useQuerySync } from '@/composables/useQuerySync'
import { formatPercent } from '@/utils/number'
import { formatWon, formatWonKorean } from '@/utils/money'
import {
  DSR_LIMIT_PCT,
  DTI_LIMIT_PCT,
  FINANCE_DISCLAIMER,
  LTV_LIMIT_PCT,
} from '@/core/finance-policy'
import { calcLoanLimit } from './logic'

const input = reactive({
  annualIncome: 60_000_000,
  existingAnnualPayment: 0,
  existingAnnualInterest: 0,
  housePrice: 500_000_000,
  annualRatePct: 4.2,
  years: 30,
  dsrLimitPct: DSR_LIMIT_PCT,
  dtiLimitPct: DTI_LIMIT_PCT,
  ltvLimitPct: LTV_LIMIT_PCT,
})

useQuerySync(input)

const result = computed(() => calcLoanLimit(input))

const bindingLabel = computed(() => {
  switch (result.value.binding) {
    case 'DSR':
      return '소득(DSR) 기준'
    case 'DTI':
      return '소득(DTI) 기준'
    case 'LTV':
      return '담보(LTV) 기준'
    default:
      return '한도 없음'
  }
})

const noRoom = computed(() => result.value.final === 0)
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <NumberField
        v-model="input.annualIncome"
        label="연소득 (세전)"
        suffix="원"
        thousands
        :step="1_000_000"
        :min="0"
        :hint="formatWonKorean(input.annualIncome)"
      />
      <NumberField
        v-model="input.existingAnnualPayment"
        label="기존 대출 연간 원리금 상환액"
        suffix="원"
        thousands
        :step="1_000_000"
        :min="0"
        hint="DSR 산정 · 없으면 0"
      />
      <NumberField
        v-model="input.existingAnnualInterest"
        label="기존 대출 연간 이자 상환액"
        suffix="원"
        thousands
        :step="1_000_000"
        :min="0"
        hint="DTI 산정 · 위 금액 중 이자분"
      />
      <NumberField
        v-model="input.housePrice"
        label="주택 가격 (담보)"
        suffix="원"
        thousands
        :step="10_000_000"
        :min="0"
        hint="0이면 LTV 기준 제외"
      />
      <div class="grid gap-4 sm:grid-cols-2">
        <NumberField
          v-model="input.annualRatePct"
          label="연 금리"
          suffix="%"
          :step="0.1"
          :digits="2"
          :min="0"
          :max="30"
        />
        <NumberField
          v-model="input.years"
          label="대출 기간"
          suffix="년"
          :step="5"
          :min="1"
          :max="50"
        />
      </div>
      <div class="grid gap-4 sm:grid-cols-3">
        <NumberField
          v-model="input.dsrLimitPct"
          label="DSR 한도"
          suffix="%"
          :step="5"
          :min="1"
          :max="100"
        />
        <NumberField
          v-model="input.dtiLimitPct"
          label="DTI 한도"
          suffix="%"
          :step="5"
          :min="0"
          :max="100"
          hint="0이면 제외"
        />
        <NumberField
          v-model="input.ltvLimitPct"
          label="LTV 한도"
          suffix="%"
          :step="5"
          :min="1"
          :max="100"
        />
      </div>
    </template>

    <template #result>
      <ResultCard
        label="최대 대출 한도"
        :value="formatWon(result.final)"
        :note="
          noRoom
            ? '기존 상환액이 소득 대비 한도를 초과했습니다'
            : `${bindingLabel}으로 한도가 결정됩니다`
        "
        primary
        copyable
      />

      <div class="grid gap-3 sm:grid-cols-2">
        <ResultCard
          label="DSR 기준 한도"
          :value="formatWon(result.byDsr)"
          :note="`연소득의 ${input.dsrLimitPct}%까지 원리금 상환 가정`"
        />
        <ResultCard
          v-if="result.byDti !== null"
          label="DTI 기준 한도"
          :value="formatWon(result.byDti)"
          :note="`기존 부채는 이자만 반영 (${input.dtiLimitPct}%)`"
        />
        <ResultCard v-else label="DTI 기준 한도" value="적용 안 함" note="DTI 한도 0%" />
        <ResultCard
          v-if="result.byLtv !== null"
          label="LTV 기준 한도"
          :value="formatWon(result.byLtv)"
          :note="`주택가격의 ${input.ltvLimitPct}%`"
        />
        <ResultCard v-else label="LTV 기준 한도" value="적용 안 함" note="주택 가격 미입력" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <ResultCard label="예상 월 상환액" :value="formatWon(result.monthlyPayment)" />
        <ResultCard
          label="한도 대출 시 DSR"
          :value="formatPercent(result.actualDsr, 1)"
          :note="`한도 ${input.dsrLimitPct}%`"
        />
      </div>
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          <strong class="text-ink">DSR (총부채원리금상환비율)</strong><br />
          <code>DSR = (신규 대출 연 원리금 + 기존 대출 연 원리금) ÷ 연소득</code><br />
          허용 연상환액에서 원리금균등 공식을 역산해 최대 원금을 구합니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">DTI (총부채상환비율)</strong><br />
          <code>DTI = (신규 대출 연 원리금 + 기존 대출 연 이자) ÷ 연소득</code><br />
          기존 부채의 원금 상환분을 보지 않으므로 보통 DSR보다 한도가 느슨하게 나옵니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">LTV (담보인정비율)</strong><br />
          <code>LTV 한도 = 주택가격 × LTV 비율</code>
        </p>
        <p class="mb-2">
          세 기준을 각각 계산한 뒤 <strong class="text-ink">가장 낮은 값</strong>이 실제 한도가
          됩니다. 주택 가격을 0으로 두면 담보 없는 대출(신용대출 등)로 보고 소득 기준만 적용하며,
          DTI 한도를 0으로 두면 DTI를 제외합니다.
        </p>
        <p class="mb-2">
          실제 DSR 심사는 대출 종류별로 인정 만기를 다르게 적용(예: 신용대출 5년)하고, 규제지역
          여부·주택 수·생애최초 여부에 따라 LTV 비율이 달라집니다. 이 도구는 신규 대출 조건 하나만
          두고 단순화한 계산입니다.
        </p>
        <p class="text-xs">{{ FINANCE_DISCLAIMER }}</p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
