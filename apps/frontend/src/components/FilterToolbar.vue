<template>
  <div :class="SURFACE_CARD_CLASS" class="flex flex-wrap items-end justify-between gap-4 p-4">
    <TimeRangeFilter v-model:time-range="timeRange" class="min-w-[180px]" />
    <SearchBar v-model="search" class="min-w-[220px] flex-1" />
    <MagnitudeFilter v-model="minMagnitude" class="min-w-[200px] flex-1" />
    <div class="flex min-w-[280px] flex-1 items-end gap-2">
      <FilterSelect v-model="sortBy" label="Sort By" :options="sortByOptions" />
      <FilterSelect v-model="sortOrder" label="Order" :options="sortOrderOptions" />
    </div>
    <button
      type="button"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
      @click="emit('apply')"
    >
      <Icon icon="lucide:filter" class="h-4 w-4 shrink-0" />
      Apply filters
    </button>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import FilterSelect from '@/components/FilterSelect.vue';
import MagnitudeFilter from '@/components/MagnitudeFilter.vue';
import SearchBar from '@/components/SearchBar.vue';
import TimeRangeFilter from '@/components/TimeRangeFilter.vue';
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';
import type { EarthquakeTimeRange, SortField, SortOrder } from '@earthquake/shared-types';

const timeRange = defineModel<EarthquakeTimeRange>('timeRange', { required: true });
const search = defineModel<string>('search', { required: true });
const minMagnitude = defineModel<number>('minMagnitude', { required: true });
const sortBy = defineModel<SortField>('sortBy', { required: true });
const sortOrder = defineModel<SortOrder>('sortOrder', { required: true });

const emit = defineEmits<{
  apply: [];
}>();

const sortByOptions = [
  { value: 'time', label: 'Date' },
  { value: 'magnitude', label: 'Magnitude' },
];

const sortOrderOptions = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];
</script>
