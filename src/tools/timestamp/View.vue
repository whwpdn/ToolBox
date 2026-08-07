<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import SelectField from '@/components/ui/SelectField.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import { formatNumber } from '@/utils/number'
import {
  CITIES,
  formatInZone,
  fromDateString,
  fromEpoch,
  guessUnit,
  toDateTimeLocal,
  type TimestampUnit,
} from './logic'

type Mode = 'epoch' | 'date'

/**
 * '지금'은 상대 시각 표시에만 쓰인다. 1초마다 갱신해 화면이 멈춘 것처럼 보이지 않게 한다.
 * 계산 결과 자체는 now에 의존하지 않으므로 값이 흔들리지 않는다.
 */
const now = ref(Date.now())
const timer = setInterval(() => (now.value = Date.now()), 1000)
onUnmounted(() => clearInterval(timer))

const mode = ref<Mode>('epoch')
const epochText = ref(String(Math.floor(Date.now() / 1000)))
const unit = ref<TimestampUnit | 'auto'>('auto')
const dateText = ref(toDateTimeLocal(Date.now()))
/** SelectField 는 문자열 모델만 다루므로 'local' | 'utc' 로 표현한다 */
const dateBase = ref<'local' | 'utc'>('local')
const dateAsUTC = computed(() => dateBase.value === 'utc')

const epochValue = computed(() => Number(epochText.value.replace(/[,\s_]/g, '')))

const resolvedUnit = computed<TimestampUnit>(() =>
  unit.value === 'auto' ? guessUnit(epochValue.value) : unit.value,
)

const result = computed(() =>
  mode.value === 'epoch'
    ? fromEpoch(epochValue.value, resolvedUnit.value, now.value)
    : fromDateString(dateText.value, dateAsUTC.value, now.value),
)

const cityRows = computed(() =>
  CITIES.map((c) => ({ ...c, time: formatInZone(result.value.epochMs, c.zone) })),
)

function useNow() {
  const ms = Date.now()
  epochText.value = String(resolvedUnit.value === 'seconds' ? Math.floor(ms / 1000) : ms)
  dateText.value = toDateTimeLocal(ms)
}
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <div class="flex overflow-hidden rounded-lg border border-line">
        <button
          v-for="m in ['epoch', 'date'] as Mode[]"
          :key="m"
          type="button"
          class="flex-1 py-2 text-sm transition-colors"
          :class="mode === m ? 'bg-brand text-brand-ink' : 'bg-surface text-muted hover:text-ink'"
          :aria-pressed="mode === m"
          @click="mode = m"
        >
          {{ m === 'epoch' ? '타임스탬프 → 날짜' : '날짜 → 타임스탬프' }}
        </button>
      </div>

      <template v-if="mode === 'epoch'">
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-ink">유닉스 타임스탬프</span>
          <input
            v-model="epochText"
            type="text"
            inputmode="numeric"
            placeholder="1785399300"
            class="tabular w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-brand"
          />
        </label>

        <SelectField
          v-model="unit"
          label="단위"
          :options="[
            {
              value: 'auto',
              label: `자동 감지 (현재: ${resolvedUnit === 'seconds' ? '초' : '밀리초'})`,
            },
            { value: 'seconds', label: '초 (10자리)' },
            { value: 'milliseconds', label: '밀리초 (13자리)' },
          ]"
        />
      </template>

      <template v-else>
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-ink">날짜 · 시각</span>
          <input
            v-model="dateText"
            type="datetime-local"
            step="1"
            class="tabular w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-brand"
          />
        </label>

        <SelectField
          v-model="dateBase"
          label="입력한 시각의 기준"
          :options="[
            { value: 'local', label: `현지 시각 (${result.localZone || '브라우저 시간대'})` },
            { value: 'utc', label: 'UTC 기준' },
          ]"
        />
      </template>

      <button
        type="button"
        class="w-full rounded-lg border border-line bg-surface py-2.5 text-sm text-muted transition-colors hover:border-brand hover:text-brand"
        @click="useNow"
      >
        지금 시각 넣기
      </button>

      <div v-if="result.valid" class="overflow-hidden rounded-xl border border-line bg-surface">
        <p class="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">주요 도시 시각</p>
        <ul>
          <li
            v-for="city in cityRows"
            :key="city.zone"
            class="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2 text-sm last:border-0"
          >
            <span class="text-muted">{{ city.label }}</span>
            <span class="tabular text-ink">{{ city.time }}</span>
          </li>
        </ul>
      </div>
    </template>

    <template #result>
      <template v-if="result.valid">
        <ResultCard
          :label="mode === 'epoch' ? '현지 시각' : '유닉스 타임스탬프 (초)'"
          :value="mode === 'epoch' ? result.local : formatNumber(result.epochSeconds)"
          :note="result.relative"
          primary
          copyable
        />

        <div class="overflow-hidden rounded-xl border border-line bg-surface">
          <ul>
            <li
              v-for="row in [
                { label: '유닉스 (초)', value: String(result.epochSeconds) },
                { label: '유닉스 (밀리초)', value: String(result.epochMs) },
                { label: 'ISO 8601 (UTC)', value: result.iso },
                { label: 'UTC', value: result.utc },
                { label: `현지 (${result.localZone})`, value: result.local },
              ]"
              :key="row.label"
              class="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5 text-sm last:border-0"
            >
              <span class="shrink-0 text-muted">{{ row.label }}</span>
              <span class="tabular min-w-0 flex-1 truncate text-right text-ink">
                {{ row.value }}
              </span>
              <CopyButton :text="row.value" label="" />
            </li>
          </ul>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <ResultCard label="요일" :value="`${result.weekday}요일`" />
          <ResultCard
            label="UTC 오프셋"
            :value="result.offsetLabel"
            :note="`${result.localZone} 기준`"
          />
        </div>
      </template>

      <p v-else class="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
        올바른 타임스탬프나 날짜를 입력하면 결과가 표시됩니다.
      </p>
    </template>

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          <strong class="text-ink">유닉스 타임스탬프</strong>는 1970년 1월 1일 00:00:00 UTC부터 흐른
          시간입니다. 초 단위(10자리)와 밀리초 단위(13자리)가 섞여 쓰이는데, 자릿수로 자동
          구분합니다. JavaScript의 <code>Date.now()</code> 는 밀리초, Unix 계열 도구는 보통
          초입니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">타임스탬프에는 시간대가 없습니다.</strong> 항상 UTC 기준 절대
          시각이며, 사람이 읽는 시각으로 바꿀 때 비로소 시간대가 붙습니다. 같은 타임스탬프가
          서울에서는 17시, 런던에서는 8시로 보이는 이유입니다.
        </p>
        <p class="mb-2">
          <strong class="text-ink">시간대 변환</strong>은 브라우저의 Intl API에 맡깁니다. 오프셋을
          직접 더하면 서머타임이 있는 지역(뉴욕·런던 등)에서 틀립니다. 한국은 서머타임이 없어 항상
          <code>+09:00</code> 입니다.
        </p>
        <p>
          '날짜 → 타임스탬프' 모드에서 입력한 시각을 현지 기준으로 볼지 UTC 기준으로 볼지 고를 수
          있습니다. 같은 문자열이라도 기준에 따라 9시간 차이가 납니다.
        </p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
