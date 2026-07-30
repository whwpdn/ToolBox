<script setup lang="ts">
import AppIcon from './AppIcon.vue'

const props = withDefaults(defineProps<{ title?: string; open?: boolean }>(), {
  title: '계산식 · 참고사항',
  open: false,
})
</script>

<template>
  <details :open="props.open" class="group rounded-xl border border-line bg-surface">
    <summary
      class="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-ink marker:content-none"
    >
      <AppIcon
        name="chevron-right"
        :size="16"
        class="text-muted transition-transform group-open:rotate-90"
      />
      {{ props.title }}
    </summary>
    <div
      class="border-t border-line px-4 py-3 text-sm leading-relaxed text-muted [&_code]:rounded [&_code]:bg-surface-hover [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs"
    >
      <slot />
    </div>
  </details>
</template>
