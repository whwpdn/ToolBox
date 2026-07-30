<script setup lang="ts">
import ToolLayout from '@/layouts/ToolLayout.vue'
import UnitConverter from '@/components/UnitConverter.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import { TEMPERATURE_UNITS, convertTemperature } from './logic'
</script>

<template>
  <ToolLayout>
    <UnitConverter
      :units="TEMPERATURE_UNITS"
      default-from="c"
      default-to="f"
      :default-value="36.5"
      :converter="convertTemperature"
      :digits="8"
    />

    <template #note>
      <FormulaNote>
        <p class="mb-2">
          온도는 단위마다 0의 기준점이 달라서 배율만으로 변환할 수 없습니다. 모든 값을 섭씨로 모은
          뒤 목표 단위로 다시 계산합니다.
        </p>
        <ul class="ml-4 list-disc space-y-1">
          <li><code>℉ = ℃ × 9/5 + 32</code></li>
          <li><code>℃ = (℉ − 32) × 5/9</code></li>
          <li><code>K = ℃ + 273.15</code></li>
          <li><code>°R = (℃ + 273.15) × 9/5</code></li>
        </ul>
        <p class="mt-2">
          기억할 만한 값: <code>-40℃ = -40℉</code> (두 단위가 같아지는 유일한 지점),
          <code>0℃ = 32℉</code>, <code>100℃ = 212℉</code>, <code>36.5℃ = 97.7℉</code>
        </p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
