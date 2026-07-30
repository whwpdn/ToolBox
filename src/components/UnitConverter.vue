<script setup lang="ts">
import { computed, reactive } from 'vue'
import NumberField from '@/components/ui/NumberField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useQuerySync } from '@/composables/useQuerySync'
import { formatSignificant } from '@/utils/number'
import { convert as convertByFactor, unitOptions, type UnitDef } from '@/core/units'

/**
 * 단위 변환 도구의 공통 UI.
 *
 * 길이·무게·면적처럼 배율로 변환되는 단위는 units만 넘기면 되고,
 * 온도처럼 원점이 다른(배율만으로 표현 불가) 단위는 converter를 넘겨 계산을 위임한다.
 */
const props = withDefaults(
  defineProps<{
    units: UnitDef[]
    defaultFrom: string
    defaultTo: string
    defaultValue?: number
    /** 배율 변환이 불가능한 단위계용 커스텀 변환 함수 */
    converter?: (value: number, from: string, to: string) => number
    /** 결과 표시 유효자리 */
    digits?: number
  }>(),
  { defaultValue: 1, digits: 6 },
)

const state = reactive({
  value: props.defaultValue,
  from: props.defaultFrom,
  to: props.defaultTo,
})

useQuerySync(state)

const options = computed(() => unitOptions(props.units))

function run(value: number, from: string, to: string): number {
  return props.converter
    ? props.converter(value, from, to)
    : convertByFactor(value, from, to, props.units)
}

const converted = computed(() => run(state.value, state.from, state.to))

const fromLabel = computed(
  () => props.units.find((u) => u.code === state.from)?.label ?? state.from,
)
const toLabel = computed(() => props.units.find((u) => u.code === state.to)?.label ?? state.to)

/** 입력값을 나머지 모든 단위로 한 번에 보여준다 */
const allUnits = computed(() =>
  props.units.map((u) => ({
    code: u.code,
    label: u.label,
    value: formatSignificant(run(state.value, state.from, u.code), props.digits),
    active: u.code === state.to,
  })),
)

function swap() {
  const prev = state.from
  state.from = state.to
  state.to = prev
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <section class="space-y-4" aria-label="입력">
      <NumberField v-model="state.value" label="값" :digits="0" thousands :step="1" />
      <SelectField v-model="state.from" label="변환 전 단위" :options="options" />

      <div class="flex justify-center">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:border-brand hover:text-brand"
          @click="swap"
        >
          <AppIcon name="chevron-down" :size="15" />
          단위 바꾸기
        </button>
      </div>

      <SelectField v-model="state.to" label="변환 후 단위" :options="options" />
    </section>

    <section class="space-y-4" aria-label="결과">
      <ResultCard
        :label="`${fromLabel} → ${toLabel}`"
        :value="formatSignificant(converted, props.digits)"
        :note="`${formatSignificant(state.value, props.digits)} ${state.from} = ${formatSignificant(converted, props.digits)} ${state.to}`"
        primary
        copyable
      />

      <div class="overflow-hidden rounded-xl border border-line bg-surface">
        <p class="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">전체 단위</p>
        <ul>
          <li
            v-for="u in allUnits"
            :key="u.code"
            class="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2 text-sm last:border-0"
            :class="u.active ? 'bg-brand-soft' : ''"
          >
            <span class="truncate text-muted">{{ u.label }}</span>
            <span class="tabular shrink-0 font-medium text-ink">{{ u.value }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
