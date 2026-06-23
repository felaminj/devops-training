<template>
  <section :class="SURFACE_CARD_CLASS" class="relative min-w-0 p-4 sm:p-5" aria-label="Earthquake summary">
    <div class="absolute right-4 top-4 sm:right-5 sm:top-5">
      <RefreshIndicator :active="Boolean(refreshing)" label="Updating data" />
    </div>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0">
        <div class="mb-1 text-sm text-slate-500">Monitoring Source</div>
        <div class="break-words text-xl font-bold text-slate-900 sm:text-2xl">{{ sourceTitle }}</div>
        <p class="mt-1 text-sm text-slate-500">Seismic activity from {{ timeRangeLabel }}</p>
      </div>
      <div v-if="stats?.latestEarthquake" class="min-w-0">
        <div class="mb-1 text-sm text-slate-500">Latest Event</div>
        <div class="text-base font-semibold text-slate-900">{{ stats.latestEarthquake.place }}</div>
        <p class="mt-1 text-sm text-slate-500">
          M {{ formatMagnitude(stats.latestEarthquake.magnitude) }} ·
          {{ formatRelativeTime(stats.latestEarthquake.time) }}
        </p>
      </div>
    </div>
    <div class="mt-4 h-px w-full bg-slate-200" aria-hidden="true" />
    <div class="mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-2 md:grid-cols-4 md:gap-y-5">
      <AppMetricItem
        v-for="metric in metrics"
        :key="metric.label"
        :label="metric.label"
        :value="metric.value"
        :icon="metric.icon"
        :tone="metric.tone"
        :subtitle="metric.subtitle"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DashboardStats } from '@earthquake/shared-types';
import { formatMagnitude, formatRelativeTime } from '@earthquake/shared-utils';
import AppMetricItem from '@/components/AppMetricItem.vue';
import RefreshIndicator from '@/components/RefreshIndicator.vue';
import type { MetricIconTone } from '@/constants/metricIconTones';
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';

const props = defineProps<{
  stats: DashboardStats | null;
  refreshing?: boolean;
  timeRangeLabel?: string;
  sourceTitle?: string;
}>();

const sourceTitle = computed(() => props.sourceTitle ?? 'USGS Earthquake Feed');
const timeRangeLabel = computed(() => props.timeRangeLabel ?? 'the last 24 hours');

const metrics = computed(() => {
  const items: Array<{
    label: string;
    value: string | number;
    icon: string;
    tone: MetricIconTone;
    subtitle?: string;
  }> = [
    {
      label: 'Total Events',
      value: props.stats?.totalEarthquakes ?? 0,
      icon: 'lucide:activity',
      tone: 'blue',
      subtitle: props.timeRangeLabel ?? 'Last 24 hours',
    },
    {
      label: 'Largest Magnitude',
      value: formatMagnitude(props.stats?.largestMagnitude ?? null),
      icon: 'lucide:trending-up',
      tone: 'rose',
    },
    {
      label: 'Average Magnitude',
      value: formatMagnitude(props.stats?.averageMagnitude ?? null),
      icon: 'lucide:bar-chart-3',
      tone: 'indigo',
    },
    {
      label: 'Significant Events',
      value: props.stats?.significantEvents ?? 0,
      icon: 'lucide:alert-triangle',
      tone: 'amber',
      subtitle: 'Magnitude >= 5.0',
    },
  ];
  return items;
});
</script>
