<template>
  <div ref="mapContainer" class="modal-earthquake-map" />
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue';
import type { Earthquake } from '@earthquake/shared-types';
import { useModalEarthquakeMap } from '@/composables/useModalEarthquakeMap';

const props = defineProps<{
  earthquakes: Earthquake[];
  focusEarthquake: Earthquake | null;
  isActive: boolean;
}>();

const mapContainer = ref<HTMLElement | null>(null);
useModalEarthquakeMap(
  mapContainer,
  toRef(props, 'earthquakes'),
  toRef(props, 'focusEarthquake'),
  toRef(props, 'isActive')
);
</script>
