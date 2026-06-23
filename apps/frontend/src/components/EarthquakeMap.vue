<template>
  <div
    :class="SURFACE_CARD_CLASS"
    class="relative h-[min(72vh,760px)] min-h-[420px] overflow-hidden shadow-sm"
  >
    <div ref="mapContainer" class="leaflet-map-root h-full w-full" />
    <div
      v-if="loading && earthquakes.length === 0"
      class="absolute inset-0 z-[500] flex items-center justify-center bg-white/70"
    >
      <LoadingSpinner />
    </div>
    <div v-if="refreshing" class="absolute right-3 top-3 z-[500]">
      <RefreshIndicator active label="Updating map" />
    </div>
    <div class="pointer-events-none absolute bottom-3 left-3 z-[400]">
      <slot name="overlay-bottom-left" />
    </div>
    <EarthquakeIntensityModal
      v-model="isIntensityModalOpen"
      :loading="intensityModalLoading"
      :earthquake="intensityModalEarthquake"
      :intensity-payload="intensityModalPayload"
      :intensity-unavailable="intensityModalUnavailable"
      :intensity-message="intensityModalMessage"
      @update:model-value="onIntensityModalChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, ref, toRef } from 'vue';
import type { Earthquake, EarthquakeDataSource } from '@earthquake/shared-types';
import type { UserLocation } from '@/stores/monitoringPreferencesStore';
import EarthquakeIntensityModal from '@/components/EarthquakeIntensityModal.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import RefreshIndicator from '@/components/RefreshIndicator.vue';
import { useEarthquakeIntensityModal } from '@/composables/useEarthquakeIntensityModal';
import { useEarthquakeMap } from '@/composables/useEarthquakeMap';
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';

const props = defineProps<{
  earthquakes: Earthquake[];
  loading?: boolean;
  refreshing?: boolean;
  userLocation?: UserLocation | null;
  nearMeRadiusKm?: number | null;
  groupMarkers?: boolean;
  showPlateBoundaries?: boolean;
  enabledFaultLayerIds?: string[];
  loadingFaultLayerIds?: string[];
  enabledTrenchLayerIds?: string[];
  loadingTrenchLayerIds?: string[];
  enabledVolcanoLayerIds?: string[];
  loadingVolcanoLayerIds?: string[];
  newlyAddedIds?: string[];
  dataSource?: EarthquakeDataSource;
}>();

const mapContainer = ref<HTMLElement | null>(null);
const earthquakesRef = toRef(props, 'earthquakes');
const userLocationRef = computed(() => props.userLocation ?? null);
const nearMeRadiusRef = computed(() => props.nearMeRadiusKm ?? null);
const groupMarkersRef = computed(() => props.groupMarkers ?? true);
const showPlateBoundariesRef = computed(() => props.showPlateBoundaries ?? true);
const enabledFaultLayerIdsRef = computed(() => props.enabledFaultLayerIds ?? []);
const loadingFaultLayerIdsRef = computed(() => props.loadingFaultLayerIds ?? []);
const enabledTrenchLayerIdsRef = computed(() => props.enabledTrenchLayerIds ?? []);
const loadingTrenchLayerIdsRef = computed(() => props.loadingTrenchLayerIds ?? []);
const enabledVolcanoLayerIdsRef = computed(() => props.enabledVolcanoLayerIds ?? []);
const loadingVolcanoLayerIdsRef = computed(() => props.loadingVolcanoLayerIds ?? []);
const newlyAddedIdsRef = computed(() => props.newlyAddedIds ?? []);
const dataSourceRef = computed(() => props.dataSource ?? 'usgs');
const {
  isOpen: isIntensityModalOpen,
  loading: intensityModalLoading,
  earthquake: intensityModalEarthquake,
  intensityPayload: intensityModalPayload,
  intensityUnavailable: intensityModalUnavailable,
  intensityMessage: intensityModalMessage,
  open: openIntensityModal,
  close: closeIntensityModal,
} = useEarthquakeIntensityModal();
const mapApi = useEarthquakeMap(
  mapContainer,
  earthquakesRef,
  userLocationRef,
  nearMeRadiusRef,
  groupMarkersRef,
  showPlateBoundariesRef,
  enabledFaultLayerIdsRef,
  loadingFaultLayerIdsRef,
  enabledTrenchLayerIdsRef,
  loadingTrenchLayerIdsRef,
  enabledVolcanoLayerIdsRef,
  loadingVolcanoLayerIdsRef,
  newlyAddedIdsRef,
  dataSourceRef,
  (earthquake) => {
    void openIntensityModal(earthquake);
  }
);

function onIntensityModalChange(open: boolean): void {
  if (!open) closeIntensityModal();
}

onActivated(() => {
  if (dataSourceRef.value === 'phivolcs') {
    window.setTimeout(() => mapApi.focusPhilippinesView(), 150);
  }
  window.setTimeout(() => mapApi.refreshLayout(), 100);
  window.setTimeout(() => mapApi.refreshLayout(), 350);
  window.setTimeout(() => mapApi.refreshLayout(), 700);
});

defineExpose({
  fitBounds: () => mapApi.fitBounds(),
  resetView: () => mapApi.resetView(),
  refreshLayout: () => mapApi.refreshLayout(),
  locateEarthquake: (earthquake: Earthquake) => mapApi.locateEarthquake(earthquake),
  focusPhilippinesView: () => mapApi.focusPhilippinesView(),
});
</script>
