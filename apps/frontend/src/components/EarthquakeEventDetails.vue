<template>
  <dl class="grid gap-3 sm:grid-cols-2">
    <div v-for="item in detailItems" :key="item.label">
      <dt class="text-xs text-slate-500">{{ item.label }}</dt>
      <dd class="mt-0.5 text-sm font-semibold text-slate-900">{{ item.value }}</dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Earthquake } from '@earthquake/shared-types';
import {
  formatCoordinates,
  formatDepth,
  formatMagnitude,
  formatTimestamp,
} from '@earthquake/shared-utils';

const props = defineProps<{
  earthquake: Earthquake;
  hideMagnitude?: boolean;
}>();

function formatOptionalYesNo(value: boolean | null | undefined): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unknown';
}

const detailItems = computed(() => {
  const earthquake = props.earthquake;
  const items = [
    { label: 'Event ID', value: earthquake.id },
    { label: 'Source', value: earthquake.dataSource === 'phivolcs' ? 'PHIVOLCS' : 'USGS' },
    { label: 'Time', value: formatTimestamp(earthquake.time) },
    { label: 'Coordinates', value: formatCoordinates(earthquake.latitude, earthquake.longitude) },
    { label: 'Depth', value: formatDepth(earthquake.depth) },
    { label: 'Status', value: earthquake.status },
  ];
  if (earthquake.dataSource === 'phivolcs') {
    if (earthquake.instrumentalIntensity) {
      items.push({ label: 'Instrumental intensity', value: earthquake.instrumentalIntensity });
    }
    if (earthquake.origin) items.push({ label: 'Origin', value: earthquake.origin });
    items.push({ label: 'Damage expected', value: formatOptionalYesNo(earthquake.expectingDamage) });
    items.push({ label: 'Aftershocks expected', value: formatOptionalYesNo(earthquake.expectingAftershocks) });
  }
  if (earthquake.felt !== null && earthquake.felt !== undefined) {
    items.push({ label: 'Felt reports', value: String(earthquake.felt) });
  }
  if (earthquake.mmi !== null && earthquake.mmi !== undefined) {
    items.push({ label: 'MMI', value: earthquake.mmi.toFixed(1) });
  }
  if (earthquake.cdi !== null && earthquake.cdi !== undefined) {
    items.push({ label: 'CDI', value: earthquake.cdi.toFixed(1) });
  }
  if (!props.hideMagnitude) {
    items.splice(2, 0, { label: 'Magnitude', value: `M ${formatMagnitude(earthquake.magnitude)}` });
  }
  return items;
});
</script>
