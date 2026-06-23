<template>
  <article class="rounded-xl border border-slate-200 bg-card p-4 shadow-sm dark:border-slate-700 dark:bg-card-dark">
    <div class="mb-2 flex items-center justify-between">
      <span
        class="rounded-full px-2 py-1 text-xs font-semibold text-white"
        :style="{ backgroundColor: magnitudeColor }"
      >
        M {{ formattedMagnitude }}
      </span>
      <span class="text-xs text-slate-500 dark:text-slate-400">{{ relativeTime }}</span>
    </div>
    <h3 class="text-base font-semibold">{{ earthquake.place }}</h3>
    <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ coordinates }}</p>
    <RouterLink
      :to="{ name: 'earthquake-details', params: { id: earthquake.id } }"
      class="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
    >
      View details
    </RouterLink>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Earthquake } from '@earthquake/shared-types';
import {
  formatCoordinates,
  formatMagnitude,
  formatRelativeTime,
  getMagnitudeHexColor,
} from '@earthquake/shared-utils';

const props = defineProps<{
  earthquake: Earthquake;
}>();

const formattedMagnitude = computed(() => formatMagnitude(props.earthquake.magnitude));
const magnitudeColor = computed(() => getMagnitudeHexColor(props.earthquake.magnitude));
const relativeTime = computed(() => formatRelativeTime(props.earthquake.time));
const coordinates = computed(() =>
  formatCoordinates(props.earthquake.latitude, props.earthquake.longitude)
);
</script>
