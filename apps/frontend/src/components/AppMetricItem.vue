<template>
  <div class="flex min-w-0 items-center gap-2 sm:gap-3">
    <AppMetricIcon :icon="icon" :tone="tone" />
    <div class="min-w-0">
      <div class="text-xs text-slate-500">{{ label }}</div>
      <div class="break-words text-sm font-semibold text-slate-900">{{ value }}</div>
      <div v-if="subtitle" class="mt-0.5 truncate text-xs text-slate-500">{{ subtitle }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppMetricIcon from '@/components/AppMetricIcon.vue';
import type { MetricIconTone } from '@/constants/metricIconTones';

defineProps<{
  label: string;
  value: string | number;
  icon: string;
  tone: MetricIconTone;
  subtitle?: string;
}>();
</script>
