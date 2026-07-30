<script setup lang="ts">
import type { Column } from './types'

const props = withDefaults(
  defineProps<{
    columns: Column[]
    rows: Array<Record<string, string | number>>
    /** 표가 길 때 최대 높이를 제한하고 내부 스크롤을 준다 */
    maxHeight?: string
  }>(),
  { maxHeight: '28rem' },
)
</script>

<template>
  <div
    class="overflow-auto rounded-xl border border-line bg-surface"
    :style="{ maxHeight: props.maxHeight }"
  >
    <table class="w-full border-collapse text-sm">
      <thead class="sticky top-0 z-10 bg-surface">
        <tr class="border-b border-line">
          <th
            v-for="col in props.columns"
            :key="col.key"
            scope="col"
            class="px-3 py-2.5 font-medium whitespace-nowrap text-muted"
            :class="col.numeric ? 'text-right' : 'text-left'"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in props.rows"
          :key="i"
          class="border-b border-line last:border-0 hover:bg-surface-hover"
        >
          <td
            v-for="col in props.columns"
            :key="col.key"
            class="px-3 py-2 whitespace-nowrap"
            :class="col.numeric ? 'tabular text-right' : 'text-left'"
          >
            {{ row[col.key] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
