<script setup lang="ts">
import { computed, reactive } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useQuerySync } from '@/composables/useQuerySync'
import {
  EXAMPLES,
  TERM_COUNT,
  availableStepsAt,
  fixChainForGender,
  resolveKinship,
  type Gender,
  type Step,
} from './logic'

const MAX_STEPS = 5

/**
 * 관계 단계는 개수가 변하므로 배열이다. useQuerySync 는 평면 객체만 다루므로
 * 'father/elderBrother' 같은 문자열 한 칸으로 눌러 담아 URL에 싣는다.
 */
const state = reactive({
  gender: 'female' as Gender,
  chain: 'father/father',
})

useQuerySync(state)

const steps = computed<Step[]>(
  () => state.chain.split('/').filter(Boolean).slice(0, MAX_STEPS) as Step[],
)

const result = computed(() => resolveKinship(steps.value, state.gender))

function setChain(next: Step[]) {
  state.chain = next.join('/')
}

function updateStep(index: number, value: string) {
  const next = [...steps.value]
  next[index] = value as Step
  setChain(next)
}

function addStep() {
  if (steps.value.length >= MAX_STEPS) return
  setChain([...steps.value, 'father'])
}

function removeStep(index: number) {
  setChain(steps.value.filter((_, i) => i !== index))
}

/**
 * 성별을 바꾸면 첫 단계의 배우자가 고를 수 없는 값이 될 수 있다.
 * ('나의 아내의 아버지'를 여자가 선택한 상태) 첫 단계만 반대쪽으로 바꾼다.
 * 두 번째 이후의 아내/남편은 앞사람의 배우자라 그대로 둬야 한다 — '오빠의 아내'는 유효하다.
 */
function setGender(gender: Gender) {
  state.gender = gender
  setChain(fixChainForGender(steps.value, gender))
}

function applyExample(exampleSteps: Step[]) {
  // 첫 단계가 배우자면 그 예시는 특정 성별 전용이므로 성별을 맞춰준다
  const first = exampleSteps[0]
  if (first === 'wife') state.gender = 'male'
  else if (first === 'husband') state.gender = 'female'
  setChain([...exampleSteps])
}

const degreeLabel = computed(() => {
  const { degree } = result.value
  if (degree === null) return '무촌'
  if (degree === 0) return '0촌'
  return `${degree}촌`
})
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <fieldset>
        <legend class="mb-2 text-sm font-medium text-ink">나의 성별</legend>
        <div class="flex gap-2">
          <label
            v-for="g in ['female', 'male'] as Gender[]"
            :key="g"
            class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors"
            :class="
              state.gender === g
                ? 'border-brand bg-brand-soft font-medium text-brand'
                : 'border-line bg-surface text-muted hover:bg-surface-hover'
            "
          >
            <input
              type="radio"
              :value="g"
              :checked="state.gender === g"
              class="sr-only"
              @change="setGender(g)"
            />
            {{ g === 'female' ? '여자' : '남자' }}
          </label>
        </div>
        <p class="mt-1.5 text-xs text-muted">
          형/오빠, 누나/언니처럼 부르는 사람의 성별에 따라 호칭이 달라집니다
        </p>
      </fieldset>

      <div class="rounded-xl border border-line bg-surface p-4">
        <p class="mb-3 text-sm font-medium text-ink">관계</p>

        <div class="space-y-2">
          <div v-for="(step, i) in steps" :key="i" class="flex items-center gap-2">
            <span class="w-10 shrink-0 text-sm text-muted">{{ i === 0 ? '나의' : '그의' }}</span>
            <select
              :value="step"
              class="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink outline-none focus:border-brand"
              :aria-label="`${i + 1}번째 관계`"
              @change="updateStep(i, ($event.target as HTMLSelectElement).value)"
            >
              <option
                v-for="opt in availableStepsAt(state.gender, i)"
                :key="opt.step"
                :value="opt.step"
              >
                {{ opt.label(state.gender) }}
              </option>
            </select>
            <span class="shrink-0 text-sm text-muted">의</span>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-line p-2 text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-40"
              :disabled="steps.length <= 1"
              aria-label="이 단계 삭제"
              @click="removeStep(i)"
            >
              <AppIcon name="close" :size="14" />
            </button>
          </div>
        </div>

        <button
          type="button"
          class="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-sm text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
          :disabled="steps.length >= MAX_STEPS"
          @click="addStep"
        >
          + 관계 추가
        </button>
      </div>

      <div>
        <p class="mb-2 text-xs text-muted">자주 찾는 호칭</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="ex in EXAMPLES"
            :key="ex.label"
            type="button"
            class="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:border-brand hover:text-brand"
            @click="applyExample(ex.steps)"
          >
            {{ ex.label }}
          </button>
        </div>
      </div>
    </template>

    <template #result>
      <ResultCard
        :label="result.path"
        :value="result.term ?? '사전에 없는 조합입니다'"
        :note="result.alt ? `다르게는 ${result.alt}` : (result.note ?? undefined)"
        primary
        :copyable="!!result.term"
      />

      <div
        v-if="result.term && result.note && result.alt"
        class="rounded-xl border border-line bg-surface p-4"
      >
        <p class="text-sm text-muted">{{ result.note }}</p>
      </div>

      <ResultCard
        label="촌수"
        :value="degreeLabel"
        :note="result.degreeNote ?? '부모·자식 1촌, 형제 2촌을 더해 계산'"
      />

      <p
        v-if="!result.term && result.valid"
        class="rounded-xl border border-line bg-surface p-4 text-sm text-muted"
      >
        이 조합의 호칭은 아직 사전에 없습니다. 촌수는 위에 표시된 값이 맞습니다. 단계를 줄이거나
        다른 경로로 찾아보세요.
      </p>
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          <strong class="text-ink">촌수 계산</strong> — 부모·자식은 1촌, 형제자매는 2촌입니다. 이어
          붙인 관계의 촌수를 모두 더하면 됩니다. 할아버지는 <code>1 + 1 = 2촌</code>, 큰아버지는
          <code>1 + 2 = 3촌</code>, 사촌은 <code>1 + 2 + 1 = 4촌</code> 입니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">배우자는 무촌</strong>입니다. 혈족이 아니라 혼인으로 맺어진
          관계라 촌수를 매기지 않습니다. 배우자가 낀 경로는 촌수 대신 '무촌'으로 표시합니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">사촌의 종류</strong><br />
          아버지 형제의 자녀는 <code>사촌(종형제)</code>, 고모의 자녀는 <code>고종사촌</code>,
          외삼촌의 자녀는 <code>외사촌</code>, 이모의 자녀는 <code>이종사촌</code> 입니다. 모두
          4촌이지만 부르는 말이 다릅니다.
        </p>
        <p>
          현재 {{ TERM_COUNT }}개 조합의 호칭이 등록되어 있습니다. 호칭은 규칙으로 유도되지 않고
          관습으로 정해지므로 사전 방식으로 담았습니다. 지역·집안에 따라 다르게 부르는 경우가 있어
          널리 쓰이는 표현을 기준으로 했고, 대안이 있으면 함께 표시합니다.
        </p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
