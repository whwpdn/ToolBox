<script setup lang="ts">
import { computed, reactive } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import NumberField from '@/components/ui/NumberField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import { useQuerySync } from '@/composables/useQuerySync'
import { formatSignificant } from '@/utils/number'
import { MODE_FIELD_LABELS, MODE_LABELS, calcPercent, type PercentMode } from './logic'

const input = reactive({
  mode: 'of' as PercentMode,
  a: 50000,
  b: 10,
})

useQuerySync(input)

const labels = computed(() => MODE_FIELD_LABELS[input.mode])
const result = computed(() => calcPercent(input.mode, input.a, input.b))

const displayValue = computed(
  () => `${formatSignificant(result.value.value, 10)}${result.value.unit}`,
)

const modes = Object.entries(MODE_LABELS) as Array<[PercentMode, string]>

/** 모드별 예시 문장 */
const examples: Record<PercentMode, string> = {
  of: '50,000원의 10% 는 5,000원',
  ratio: '25는 200의 12.5%',
  change: '100에서 150으로 오르면 +50%',
  apply: '10,000원에서 10% 오르면 11,000원',
}
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <fieldset>
        <legend class="mb-2 text-sm font-medium text-ink">계산 방식</legend>
        <div class="space-y-2">
          <label
            v-for="[value, label] in modes"
            :key="value"
            class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors"
            :class="
              input.mode === value
                ? 'border-brand bg-brand-soft text-ink'
                : 'border-line bg-surface text-muted hover:bg-surface-hover'
            "
          >
            <input v-model="input.mode" type="radio" :value="value" class="sr-only" />
            <span
              class="flex size-4 shrink-0 items-center justify-center rounded-full border"
              :class="input.mode === value ? 'border-brand' : 'border-line'"
            >
              <span v-if="input.mode === value" class="size-2 rounded-full bg-brand" />
            </span>
            {{ label }}
          </label>
        </div>
      </fieldset>

      <NumberField v-model="input.a" :label="labels.a" thousands :digits="0" />
      <NumberField
        v-model="input.b"
        :label="labels.b"
        :suffix="input.mode === 'of' || input.mode === 'apply' ? '%' : ''"
        :step="input.mode === 'of' || input.mode === 'apply' ? 1 : 100"
        thousands
      />
    </template>

    <template #result>
      <ResultCard
        :label="labels.result"
        :value="displayValue"
        :note="result.formula"
        primary
        copyable
      />
      <div class="rounded-xl border border-line bg-surface p-4">
        <p class="text-sm font-medium text-ink">예시</p>
        <p class="mt-1 text-sm text-muted">{{ examples[input.mode] }}</p>
      </div>
    </template>

    <template #note>
      <FormulaNote>
        <ul class="ml-4 list-disc space-y-1.5">
          <li><strong class="text-ink">A의 B%</strong> — <code>A × B ÷ 100</code></li>
          <li><strong class="text-ink">A는 B의 몇 %</strong> — <code>A ÷ B × 100</code></li>
          <li>
            <strong class="text-ink">증감률</strong> — <code>(변경후 − 변경전) ÷ 변경전 × 100</code>
          </li>
          <li><strong class="text-ink">증감 적용</strong> — <code>A × (1 + B ÷ 100)</code></li>
        </ul>
        <p class="mt-3">
          <strong class="text-ink">주의</strong> — 10% 올린 뒤 다시 10% 내리면 원래 값으로 돌아오지
          않습니다. <code>100 → 110 → 99</code> 가 됩니다. 기준값이 달라지기 때문입니다.
        </p>
        <p class="mt-2">기준값(전체값·변경 전)이 0이면 비율을 정의할 수 없어 0을 표시합니다.</p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
