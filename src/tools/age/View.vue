<script setup lang="ts">
import { computed, reactive } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import DateField from '@/components/ui/DateField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import { useQuerySync } from '@/composables/useQuerySync'
import { formatNumber } from '@/utils/number'
import { toISODate, today } from '@/utils/date'
import { anniversaryDay, calcAge } from './logic'

const input = reactive({
  birth: '1990-05-15',
  base: toISODate(today()),
})

useQuerySync(input)

const result = computed(() => calcAge(input.birth, input.base))

const breakdownLabel = computed(() => {
  const { years, months, days } = result.value.breakdown
  return `${years}년 ${months}개월 ${days}일`
})

const birthdayNote = computed(() => {
  const days = result.value.daysToNextBirthday
  if (days === 0) return '오늘이 생일입니다'
  return `${result.value.nextBirthdayLabel}`
})

/** 자주 챙기는 기념일 */
const milestones = computed(() =>
  [100, 1000, 10000].map((n) => ({
    label: `${formatNumber(n)}일`,
    date: anniversaryDay(input.birth, n),
  })),
)
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <DateField v-model="input.birth" label="생년월일" />
      <DateField v-model="input.base" label="기준일" hint="기본값은 오늘" />

      <div
        v-if="result.valid && !result.isFuture"
        class="rounded-xl border border-line bg-surface p-4"
      >
        <p class="mb-2 text-sm font-medium text-ink">기념일</p>
        <ul class="space-y-1.5 text-sm">
          <li v-for="m in milestones" :key="m.label" class="flex justify-between gap-3">
            <span class="text-muted">태어난 지 {{ m.label }}</span>
            <span class="text-ink">{{ m.date }}</span>
          </li>
        </ul>
      </div>
    </template>

    <template #result>
      <template v-if="result.valid && !result.isFuture">
        <ResultCard
          label="만 나이"
          :value="`${result.manAge}세`"
          :note="breakdownLabel"
          primary
          copyable
        />
        <div class="grid gap-3 sm:grid-cols-2">
          <ResultCard
            label="세는 나이 (한국식)"
            :value="`${result.koreanAge}세`"
            note="태어나면 1살"
          />
          <ResultCard label="연 나이" :value="`${result.yearAge}세`" note="연도 차이만 계산" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <ResultCard
            label="다음 생일까지"
            :value="`${formatNumber(result.daysToNextBirthday)}일`"
            :note="birthdayNote"
          />
          <ResultCard
            label="살아온 날"
            :value="`${formatNumber(result.totalDays)}일`"
            :note="`태어난 요일: ${result.birthWeekday}요일`"
          />
        </div>
      </template>

      <p
        v-else-if="result.isFuture"
        class="rounded-xl border border-line bg-surface p-6 text-sm text-muted"
      >
        생년월일이 기준일보다 미래입니다. 날짜를 확인해 주세요.
      </p>
      <p v-else class="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
        생년월일을 올바르게 입력하면 결과가 표시됩니다.
      </p>
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          <strong class="text-ink">만 나이</strong> — 생일이 지나면 1살 올라갑니다. 2023년 6월부터
          법령·행정에서 기본으로 쓰는 나이입니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">세는 나이</strong> — 태어나면 1살, 해가 바뀌면 1살 늘어납니다.
          <code>기준연도 − 출생연도 + 1</code>
        </p>
        <p class="mb-2">
          <strong class="text-ink">연 나이</strong> — <code>기준연도 − 출생연도</code>. 병역법,
          청소년보호법 등 일부 법률에서 씁니다.
        </p>
        <p>2월 29일생의 다음 생일은 평년에는 3월 1일로 계산합니다.</p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
