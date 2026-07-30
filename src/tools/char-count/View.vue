<script setup lang="ts">
import { computed, ref } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import NumberField from '@/components/ui/NumberField.vue'
import { formatNumber, clamp } from '@/utils/number'
import { countText } from './logic'

/**
 * 입력 텍스트는 URL 쿼리에 싣지 않는다.
 * 자기소개서 같은 긴 개인 텍스트가 주소창·브라우저 히스토리에 남으면 곤란하다.
 */
const text = ref('')
const limit = ref(1000)

const result = computed(() => countText(text.value))

const limitProgress = computed(() =>
  limit.value > 0 ? clamp((result.value.withSpaces / limit.value) * 100, 0, 100) : 0,
)

const overLimit = computed(() => limit.value > 0 && result.value.withSpaces > limit.value)

const stats = computed(() => [
  { label: '공백 제외', value: formatNumber(result.value.withoutSpaces) },
  { label: '공백·줄바꿈 제외', value: formatNumber(result.value.withoutWhitespace) },
  { label: '단어', value: formatNumber(result.value.words) },
  { label: '줄', value: formatNumber(result.value.lines) },
  { label: '문단', value: formatNumber(result.value.paragraphs) },
  { label: '문장', value: formatNumber(result.value.sentences) },
  { label: 'UTF-8 바이트', value: formatNumber(result.value.bytesUtf8) },
  { label: 'EUC-KR 바이트', value: formatNumber(result.value.bytesEucKr) },
])
</script>

<template>
  <ToolLayout wide>
    <template #inputs>
      <label class="block">
        <span class="mb-1.5 flex items-baseline justify-between gap-2">
          <span class="text-sm font-medium text-ink">텍스트</span>
          <button
            v-if="text"
            type="button"
            class="text-xs text-muted hover:text-danger"
            @click="text = ''"
          >
            지우기
          </button>
        </span>
        <textarea
          v-model="text"
          rows="12"
          placeholder="여기에 텍스트를 붙여넣으세요"
          class="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-base leading-relaxed text-ink outline-none focus:border-brand"
        />
      </label>

      <NumberField
        v-model="limit"
        label="글자수 제한 (0이면 사용 안 함)"
        suffix="자"
        thousands
        :step="100"
        :min="0"
        hint="자소서 폼 기준 확인용"
      />

      <div v-if="limit > 0" class="rounded-xl border border-line bg-surface p-4">
        <div class="mb-2 flex items-baseline justify-between text-sm">
          <span class="text-muted">제한 대비</span>
          <span :class="overLimit ? 'font-medium text-danger' : 'text-ink'">
            {{ formatNumber(result.withSpaces) }} / {{ formatNumber(limit) }}자
          </span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-surface-hover">
          <div
            class="h-full transition-all"
            :class="overLimit ? 'bg-danger' : 'bg-brand'"
            :style="{ width: `${limitProgress}%` }"
          />
        </div>
        <p v-if="overLimit" class="mt-2 text-xs text-danger">
          {{ formatNumber(result.withSpaces - limit) }}자 초과했습니다
        </p>
      </div>
    </template>

    <template #result>
      <ResultCard
        label="공백 포함 글자수"
        :value="`${formatNumber(result.withSpaces)}자`"
        note="대부분의 자소서·이력서 폼이 쓰는 기준"
        primary
        copyable
      />

      <div class="overflow-hidden rounded-xl border border-line bg-surface">
        <ul>
          <li
            v-for="stat in stats"
            :key="stat.label"
            class="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5 text-sm last:border-0"
          >
            <span class="text-muted">{{ stat.label }}</span>
            <span class="tabular font-medium text-ink">{{ stat.value }}</span>
          </li>
        </ul>
      </div>
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          글자수 기준은 서비스마다 다릅니다. 자소서·이력서 폼은 보통
          <strong class="text-ink">공백 포함</strong>을 쓰고, 일부는 공백을 제외합니다. 제출 전에
          해당 폼의 카운터와 대조해 보세요.
        </p>
        <p class="mb-2">
          <strong class="text-ink">바이트</strong> — UTF-8에서 한글은 3바이트, EUC-KR에서는
          2바이트입니다. 관공서 양식이나 오래된 시스템은 EUC-KR 기준 바이트 제한을 쓰는 경우가
          있습니다.
        </p>
        <p class="mb-2">
          글자수는 코드 포인트 단위로 셉니다. 이모지처럼 내부적으로 2개 단위로 표현되는 문자도
          1글자로 계산합니다.
        </p>
        <p>
          <strong class="text-ink">문장 수</strong>는 마침표·물음표·느낌표를 기준으로 한
          근사값입니다. 입력한 텍스트는 브라우저 안에서만 처리되며 주소창이나 서버에 남지 않습니다.
        </p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
