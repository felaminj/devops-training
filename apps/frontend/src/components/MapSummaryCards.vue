<template>
  <div class="grid grid-cols-3 gap-3">
    <div
      v-for="card in cards"
      :key="card.label"
      class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
    >
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ card.label }}</p>
      <p class="mt-1 text-lg font-semibold text-slate-900">{{ card.value }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  totalEvents: number;
  significantEvents: number;
  largestMagnitude: string;
}>();

const cards = computed(() => [
  { label: 'Events', value: props.totalEvents },
  { label: 'Significant', value: props.significantEvents },
  { label: 'Largest', value: props.largestMagnitude },
]);
</script>
