<script setup lang="ts">
import ToolLayout from '@/layouts/ToolLayout.vue'
import UnitConverter from '@/components/UnitConverter.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import { WEIGHT_UNITS } from '@/core/units'
</script>

<template>
  <ToolLayout>
    <UnitConverter :units="WEIGHT_UNITS" default-from="kg" default-to="lb" :default-value="70" />

    <template #note>
      <FormulaNote>
        <p class="mb-2">기준 단위는 킬로그램(kg)이며, 각 단위의 배율로 변환합니다.</p>
        <ul class="ml-4 list-disc space-y-1">
          <li><code>1 파운드 = 0.45359237 kg</code> (국제 정의, 정확값)</li>
          <li><code>1 온스 = 1/16 파운드 ≈ 28.35 g</code></li>
          <li>
            <code>1 근 = 600 g</code> (고기·채소 기준. 과일·채소는 375g을 쓰는 경우도 있습니다)
          </li>
          <li><code>1 돈 = 3.75 g</code> (금·은 거래 단위)</li>
          <li><code>1 관 = 3.75 kg = 1,000 돈</code></li>
        </ul>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
