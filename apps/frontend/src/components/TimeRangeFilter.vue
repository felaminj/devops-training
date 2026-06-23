<template>
  <FilterSelect
    v-model="timeRangeValue"
    label="Time range"
    :options="timeRangeOptions"
    class="min-w-[180px]"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EarthquakeTimeRange } from '@earthquake/shared-types';
import { EARTHQUAKE_TIME_RANGE_OPTIONS } from '@earthquake/shared-utils';
import FilterSelect from '@/components/FilterSelect.vue';

const timeRange = defineModel<EarthquakeTimeRange>('timeRange', { required: true });

const timeRangeOptions = EARTHQUAKE_TIME_RANGE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const timeRangeValue = computed({
  get: () => timeRange.value,
  set: (value: string) => {
    timeRange.value = value as EarthquakeTimeRange;
  },
});
</script>
