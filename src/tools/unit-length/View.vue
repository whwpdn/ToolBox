<script setup lang="ts">
import ToolLayout from '@/layouts/ToolLayout.vue'
import UnitConverter from '@/components/UnitConverter.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import { LENGTH_UNITS } from '@/core/units'
</script>

<template>
  <ToolLayout>
    <UnitConverter :units="LENGTH_UNITS" default-from="cm" default-to="in" :default-value="170" />

    <template #note>
      <FormulaNote>
        <p class="mb-2">기준 단위는 미터(m)이며, 각 단위의 배율로 변환합니다.</p>
        <ul class="ml-4 list-disc space-y-1">
          <li><code>1 인치 = 2.54 cm</code> (국제 정의, 정확값)</li>
          <li><code>1 피트 = 12 인치 = 30.48 cm</code></li>
          <li><code>1 야드 = 3 피트 = 91.44 cm</code></li>
          <li><code>1 마일 = 1,609.344 m</code></li>
          <li><code>1 자(척) = 10/33 m ≈ 30.3 cm</code> (한국 전통 단위)</li>
          <li><code>1 해리 = 1,852 m</code> (항해·항공용)</li>
        </ul>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
