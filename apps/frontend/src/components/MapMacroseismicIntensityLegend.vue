<template>
  <div :class="SURFACE_CARD_CLASS" class="inline-flex flex-col gap-1.5 p-2 shadow-sm">
    <div class="flex items-stretch overflow-hidden rounded border border-slate-300">
      <span class="flex w-14 shrink-0 items-center bg-slate-50 px-1.5 text-[9px] font-bold text-slate-600">
        Intensity
      </span>
      <div class="flex min-w-0">
        <div
          v-for="column in legendColumns"
          :key="`intensity-${column.intensity}`"
          class="flex h-5 min-w-[2.25rem] flex-1 items-center justify-center text-[8px] font-bold text-slate-900"
          :style="{ backgroundColor: column.color }"
          :title="`${column.intensity}: ${column.shaking}`"
        >
          {{ column.intensity }}
        </div>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-500">
      <span class="inline-flex items-center gap-1">
        <span class="shakemap-symbol shakemap-symbol-star">★</span>
        Epicenter
      </span>
      <span v-if="showReportedIntensity" class="inline-flex items-center gap-1">
        <span class="shakemap-symbol shakemap-symbol-circle" />
        Reported
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SHAKEMAP_LEGEND_COLUMNS } from '@earthquake/shared-utils';
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';

defineProps<{
  showReportedIntensity?: boolean;
}>();

const legendColumns = SHAKEMAP_LEGEND_COLUMNS;
</script>
