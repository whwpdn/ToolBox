<script setup lang="ts">
import ToolLayout from '@/layouts/ToolLayout.vue'
import UnitConverter from '@/components/UnitConverter.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import { AREA_UNITS } from '@/core/units'
</script>

<template>
  <ToolLayout>
    <UnitConverter :units="AREA_UNITS" default-from="m2" default-to="pyeong" :default-value="84" />

    <template #note>
      <FormulaNote :open="true">
        <p class="mb-2">
          <strong class="text-ink">1평 = 400/121 ㎡ ≈ 3.305785 ㎡</strong><br />
          평은 6자×6자(1간×1간)에서 온 단위입니다. 1자 = 10/33 m 이므로
          <code>(60/33)² = 400/121</code> 이 됩니다. 3.3058을 쓰는 계산기와 소수점 아래에서 미세하게
          다를 수 있어, 여기서는 분수를 그대로 사용합니다.
        </p>
        <p class="mb-2">자주 쓰는 값:</p>
        <ul class="ml-4 list-disc space-y-1">
          <li><code>59㎡ ≈ 17.8평</code> (보통 '24평형'으로 표기)</li>
          <li><code>84㎡ ≈ 25.4평</code> (보통 '34평형'으로 표기)</li>
          <li><code>114㎡ ≈ 34.5평</code> (보통 '45평형'으로 표기)</li>
        </ul>
        <p class="mt-2">
          아파트의 'OO평형'은 전용면적이 아니라 공용면적을 포함한 공급면적 기준이라 전용면적
          환산값과 다릅니다.
        </p>
        <p class="mt-2">
          토지 단위: <code>1단보 = 300평</code>, <code>1정보 = 3,000평 ≈ 0.99 ha</code>
        </p>
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
