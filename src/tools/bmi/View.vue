<script setup lang="ts">
import { computed, reactive } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import NumberField from '@/components/ui/NumberField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import { useQuerySync } from '@/composables/useQuerySync'
import { clamp } from '@/utils/number'
import { BMI_CATEGORIES, calcBmi } from './logic'

const input = reactive({
  heightCm: 170,
  weightKg: 65,
})

useQuerySync(input)

const result = computed(() => calcBmi(input.heightCm, input.weightKg))

const TONE_CLASS: Record<string, string> = {
  low: 'text-brand',
  normal: 'text-positive',
  warn: 'text-danger',
  danger: 'text-danger',
}

/** BMI 15~40 구간을 게이지로 표시할 때의 위치(%) */
const gaugePosition = computed(() => clamp(((result.value.bmi - 15) / 25) * 100, 0, 100))

const adviceLabel = computed(() => {
  const diff = result.value.weightToLose
  if (!result.value.valid) return ''
  if (diff === 0) return '정상 체중 범위입니다'
  if (diff > 0) return `${diff}kg 감량하면 정상 범위입니다`
  return `${Math.abs(diff)}kg 증량하면 정상 범위입니다`
})
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <NumberField
        v-model="input.heightCm"
        label="키"
        suffix="cm"
        :step="1"
        :digits="1"
        :min="50"
        :max="250"
      />
      <NumberField
        v-model="input.weightKg"
        label="체중"
        suffix="kg"
        :step="1"
        :digits="1"
        :min="10"
        :max="300"
      />

      <div class="rounded-xl border border-line bg-surface p-4">
        <p class="mb-2 text-sm font-medium text-ink">판정 기준 (대한비만학회)</p>
        <ul class="space-y-1 text-sm">
          <li
            v-for="c in BMI_CATEGORIES"
            :key="c.label"
            class="flex justify-between gap-3 rounded px-2 py-1"
            :class="result.valid && result.category.label === c.label ? 'bg-brand-soft' : ''"
          >
            <span
              :class="result.category.label === c.label ? 'font-medium text-ink' : 'text-muted'"
            >
              {{ c.label }}
            </span>
            <span class="tabular text-muted">
              {{ c.min }} ~ {{ c.max === Infinity ? '이상' : c.max }}
            </span>
          </li>
        </ul>
      </div>
    </template>

    <template #result>
      <template v-if="result.valid">
        <ResultCard
          label="BMI (체질량지수)"
          :value="String(result.bmi)"
          :note="adviceLabel"
          primary
          copyable
        />

        <div class="rounded-xl border border-line bg-surface p-4">
          <div class="mb-2 flex items-baseline justify-between">
            <span class="text-sm text-muted">판정</span>
            <span class="text-lg font-semibold" :class="TONE_CLASS[result.category.tone]">
              {{ result.category.label }}
            </span>
          </div>
          <!-- BMI 15~40 구간 게이지 -->
          <div class="relative h-2 overflow-hidden rounded-full bg-surface-hover">
            <div
              class="absolute inset-y-0 left-0 bg-brand"
              :style="{ width: `${gaugePosition}%` }"
            />
          </div>
          <div class="mt-1 flex justify-between text-xs text-muted">
            <span>15</span>
            <span>18.5</span>
            <span>23</span>
            <span>25</span>
            <span>40</span>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <ResultCard
            label="정상 체중 범위"
            :value="`${result.normalWeightMin} ~ ${result.normalWeightMax}kg`"
            note="BMI 18.5 ~ 23"
          />
          <ResultCard label="표준체중" :value="`${result.standardWeight}kg`" note="BMI 22 기준" />
        </div>
      </template>
      <p v-else class="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
        키와 체중을 입력하면 결과가 표시됩니다.
      </p>
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          <code>BMI = 체중(kg) ÷ 신장(m)²</code><br />
          예) 170cm 65kg → <code>65 ÷ 1.7² = 22.49</code>
        </p>
        <p class="mb-2">
          판정 구간은 <strong class="text-ink">대한비만학회(아시아-태평양) 기준</strong>입니다. WHO
          국제 기준은 과체중 25~30, 비만 30 이상으로 더 느슨합니다. 아시아인은 같은 BMI에서 대사질환
          위험이 더 높아 국내 기준이 더 엄격합니다.
        </p>
        <p>
          BMI는 근육량과 체지방을 구분하지 못합니다. 근육량이 많은 사람은 과체중으로, 근육이 적고
          체지방이 많은 사람은 정상으로 나올 수 있어 참고 지표로만 쓰세요.
        </p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
