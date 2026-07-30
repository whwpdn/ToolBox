<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import NumberField from '@/components/ui/NumberField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { formatSignificant } from '@/utils/number'
import { FORMULAS, computeFormula, searchFormulas, type Formula } from './logic'

const query = ref('')
const selectedId = ref(FORMULAS[0]!.id)

/** 선택한 공식의 입력값. 공식이 바뀌면 기본값으로 초기화한다 */
const values = reactive<Record<string, number>>({})

const filtered = computed(() => searchFormulas(query.value))

const selected = computed<Formula>(
  () => FORMULAS.find((f) => f.id === selectedId.value) ?? FORMULAS[0]!,
)

function loadDefaults(formula: Formula) {
  for (const key of Object.keys(values)) delete values[key]
  for (const input of formula.inputs) values[input.key] = input.value
}

watch(selected, loadDefaults, { immediate: true })

const result = computed(() => computeFormula(selected.value, values))

/** 검색 결과를 그룹별로 묶어서 보여준다 */
const grouped = computed(() => {
  const map = new Map<string, Formula[]>()
  for (const f of filtered.value) {
    const list = map.get(f.group) ?? []
    list.push(f)
    map.set(f.group, list)
  }
  return [...map.entries()]
})
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <label class="block">
        <span class="mb-1.5 block text-sm font-medium text-ink">공식 검색</span>
        <span
          class="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 focus-within:border-brand"
        >
          <AppIcon name="search" :size="16" class="shrink-0 text-muted" />
          <input
            v-model="query"
            type="text"
            placeholder="예: 원, 부피, 피타고라스"
            class="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none placeholder:text-muted"
          />
        </span>
      </label>

      <div v-if="grouped.length" class="max-h-96 space-y-4 overflow-y-auto">
        <div v-for="[group, list] in grouped" :key="group">
          <p class="mb-1.5 text-xs font-medium text-muted">{{ group }}</p>
          <ul class="space-y-1">
            <li v-for="f in list" :key="f.id">
              <button
                type="button"
                class="w-full rounded-lg border px-3 py-2 text-left transition-colors"
                :class="
                  selectedId === f.id
                    ? 'border-brand bg-brand-soft'
                    : 'border-line bg-surface hover:bg-surface-hover'
                "
                @click="selectedId = f.id"
              >
                <span class="block text-sm font-medium text-ink">{{ f.title }}</span>
                <span class="tabular mt-0.5 block font-mono text-xs text-muted">
                  {{ f.expression }}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>
      <p v-else class="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
        '{{ query }}' 와 일치하는 공식이 없습니다.
      </p>
    </template>

    <template #result>
      <div class="rounded-xl border border-line bg-surface p-4">
        <p class="text-sm text-muted">{{ selected.group }}</p>
        <h2 class="mt-0.5 font-semibold text-ink">{{ selected.title }}</h2>
        <p class="tabular mt-2 font-mono text-sm text-brand">{{ selected.expression }}</p>
      </div>

      <div class="space-y-3">
        <!-- 입력 키가 공식마다 달라 v-model 대신 명시적으로 바인딩한다 -->
        <NumberField
          v-for="field in selected.inputs"
          :key="field.key"
          :model-value="values[field.key] ?? field.value"
          :label="field.label"
          @update:model-value="values[field.key] = $event"
          :suffix="field.suffix"
          :step="1"
          :digits="0"
          thousands
        />
      </div>

      <ResultCard
        :label="selected.resultLabel"
        :value="result === null ? '계산할 수 없습니다' : formatSignificant(result, 8)"
        :note="selected.note"
        primary
        :copyable="result !== null"
      />
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          공식을 고르고 값을 넣으면 바로 계산됩니다. 길이 단위는 통일해서 넣으세요 (cm로 넣으면
          면적은 ㎠, 부피는 ㎤로 나옵니다).
        </p>
        <p class="mb-2">
          0으로 나누거나 실근이 없는 경우처럼 계산이 정의되지 않으면 '계산할 수 없습니다'로
          표시합니다.
        </p>
        <p>현재 {{ FORMULAS.length }}개의 공식이 등록되어 있습니다.</p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
