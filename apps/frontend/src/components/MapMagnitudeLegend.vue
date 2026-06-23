<template>
  <div :class="SURFACE_CARD_CLASS" class="p-3 shadow-sm">
    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Magnitude</p>
    <ul class="space-y-1.5">
      <li v-for="item in legendItems" :key="item.label" class="flex items-center gap-2 text-xs">
        <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: item.color }" />
        <span class="text-slate-700">{{ item.label }}</span>
      </li>
      <template v-if="hasGeologyLegend">
        <li class="border-t border-slate-200 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Geology
        </li>
        <li v-if="showPlateBoundaries" class="flex items-center gap-2 text-xs">
          <span class="h-0.5 w-4 rounded bg-red-600" />
          <span class="text-slate-700">Plate boundary</span>
        </li>
        <li v-if="showFaultLines" class="flex items-center gap-2 text-xs">
          <span class="h-0.5 w-4 rounded bg-violet-600" />
          <span class="text-slate-700">Active fault</span>
        </li>
        <li v-if="showTrenches" class="flex items-center gap-2 text-xs">
          <span class="h-0.5 w-4 border-t-2 border-dashed border-cyan-600" />
          <span class="text-slate-700">Ocean trench</span>
        </li>
        <li v-if="showVolcanoes" class="flex items-center gap-2 text-xs">
          <VolcanoLegendIcon color="#dc2626" />
          <span class="text-slate-700">Active volcano</span>
        </li>
        <li v-if="showVolcanoes" class="flex items-center gap-2 text-xs">
          <VolcanoLegendIcon color="#f59e0b" />
          <span class="text-slate-700">Potentially active</span>
        </li>
        <li v-if="showVolcanoes" class="flex items-center gap-2 text-xs">
          <VolcanoLegendIcon color="#64748b" />
          <span class="text-slate-700">Dormant volcano</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VolcanoLegendIcon from '@/components/VolcanoLegendIcon.vue';
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';

const props = defineProps<{
  showPlateBoundaries?: boolean;
  showFaultLines?: boolean;
  showTrenches?: boolean;
  showVolcanoes?: boolean;
}>();

const hasGeologyLegend = computed(() => (
  props.showPlateBoundaries
  || props.showFaultLines
  || props.showTrenches
  || props.showVolcanoes
));

const legendItems = [
  { label: 'M < 3.0', color: '#22c55e' },
  { label: 'M 3.0 - 4.9', color: '#eab308' },
  { label: 'M 5.0 - 6.9', color: '#f97316' },
  { label: 'M >= 7.0', color: '#ef4444' },
];
</script>
