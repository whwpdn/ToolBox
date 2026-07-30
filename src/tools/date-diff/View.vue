<script setup lang="ts">
import { computed, reactive } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import DateField from '@/components/ui/DateField.vue'
import NumberField from '@/components/ui/NumberField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import { useQuerySync } from '@/composables/useQuerySync'
import { formatNumber } from '@/utils/number'
import { addDays, toISODate, today } from '@/utils/date'
import { calcDateDiff, shiftDate } from './logic'

const now = today()

const input = reactive({
  start: toISODate(now),
  end: toISODate(addDays(now, 100)),
  offset: 100,
})

useQuerySync(input)

const diff = computed(() => calcDateDiff(input.start, input.end))
const shifted = computed(() => shiftDate(input.start, input.offset))

const breakdownLabel = computed(() => {
  const { years, months, days } = diff.value.breakdown
  return (
    [years !== 0 ? `${years}년` : '', months !== 0 ? `${months}개월` : '', `${days}일`]
      .filter(Boolean)
      .join(' ') || '0일'
  )
})

const weekLabel = computed(() => {
  const { weeks, remainderDays } = diff.value
  return remainderDays === 0
    ? `${formatNumber(weeks)}주`
    : `${formatNumber(weeks)}주 ${remainderDays}일`
})
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <DateField v-model="input.start" label="시작 날짜" />
      <DateField v-model="input.end" label="종료 날짜" />

      <div class="rounded-xl border border-line bg-surface p-4">
        <p class="mb-3 text-sm font-medium text-ink">시작 날짜에서 며칠 뒤·전</p>
        <NumberField
          v-model="input.offset"
          label="더할 일수 (음수면 이전 날짜)"
          suffix="일"
          :step="1"
          thousands
        />
        <p v-if="shifted.valid" class="mt-3 text-sm text-muted">
          →
          <strong class="text-ink">{{ shifted.label }}</strong>
        </p>
      </div>
    </template>

    <template #result>
      <template v-if="diff.valid">
        <ResultCard
          label="두 날짜 사이"
          :value="`${formatNumber(diff.days)}일`"
          :note="`${diff.startLabel} → ${diff.endLabel}`"
          primary
          copyable
        />
        <div class="grid gap-3 sm:grid-cols-2">
          <ResultCard label="년·월·일" :value="breakdownLabel" />
          <ResultCard label="주 단위" :value="weekLabel" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <ResultCard
            label="평일 (주말 제외)"
            :value="`${formatNumber(diff.weekdayCount)}일`"
            note="공휴일은 제외하지 않음"
          />
          <ResultCard label="주말" :value="`${formatNumber(diff.weekendCount)}일`" />
        </div>
        <ResultCard
          label="시작일 포함 일수"
          :value="`${formatNumber(diff.daysInclusive)}일`"
          note="행사 기간처럼 양 끝을 모두 세는 경우"
        />
      </template>
      <p v-else class="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
        두 날짜를 올바르게 입력하면 결과가 표시됩니다.
      </p>
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          날짜 차이는 <strong class="text-ink">종료일 − 시작일</strong> 로 계산합니다. 같은 날이면
          0일이며, 시작일을 1일로 세는 방식이 필요하면 '시작일 포함 일수'를 보세요.
        </p>
        <p class="mb-2">
          <strong class="text-ink">년·월·일 분해</strong> — 시작일에 개월을 더해가며 종료일을 넘지
          않는 최대 개월 수를 찾고, 남은 차이를 일수로 셉니다. 1월 31일에서 한 달 뒤는 2월 말일로
          맞춥니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">평일 계산</strong> — 토·일요일만 제외합니다. 공휴일은 매년 날짜가
          바뀌고 대체공휴일 규칙도 있어 반영하지 않았습니다.
        </p>
        <p>모든 계산은 시간대 영향을 받지 않도록 UTC 자정 기준으로 정규화한 뒤 수행합니다.</p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
