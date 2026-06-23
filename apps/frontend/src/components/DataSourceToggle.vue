<template>
  <div class="inline-flex rounded-lg border border-slate-200 bg-white p-1">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="rounded-md px-3 py-1.5 text-sm font-semibold transition"
      :class="dataSource === option.value ? activeClass : inactiveClass"
      @click="onSelect(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { EarthquakeDataSource } from '@earthquake/shared-types';
import { EARTHQUAKE_DATA_SOURCE_OPTIONS } from '@earthquake/shared-utils';

const dataSource = defineModel<EarthquakeDataSource>('dataSource', { required: true });

const options = EARTHQUAKE_DATA_SOURCE_OPTIONS;
const activeClass = 'bg-blue-600 text-white shadow-sm';
const inactiveClass = 'text-slate-700 hover:bg-slate-50';

function onSelect(value: EarthquakeDataSource): void {
  if (dataSource.value === value) return;
  dataSource.value = value;
}
</script>
