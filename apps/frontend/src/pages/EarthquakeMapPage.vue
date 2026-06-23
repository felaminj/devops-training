<template>
  <section class="space-y-5">
    <div :class="SURFACE_CARD_CLASS" class="p-4 sm:p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-semibold text-slate-900">{{ mapTitle }}</h2>
            <RefreshIndicator :active="refreshing" label="Updating data" />
          </div>
          <p class="mt-1 text-sm text-slate-500">{{ mapSubtitle }}</p>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <MapToolbar
            v-model:group-markers="monitoringPreferences.groupMarkers"
            v-model:show-plate-boundaries="monitoringPreferences.showPlateBoundaries"
            :event-count="earthquakes.length"
            @fit-all="onFitAll"
            @reset-view="onResetView"
          />
          <MapGeologyLayersControl
            :enabled-fault-layer-ids="monitoringPreferences.enabledFaultLayerIds"
            :loading-fault-layer-ids="monitoringPreferences.loadingFaultLayerIds"
            :enabled-trench-layer-ids="monitoringPreferences.enabledTrenchLayerIds"
            :loading-trench-layer-ids="monitoringPreferences.loadingTrenchLayerIds"
            :enabled-volcano-layer-ids="monitoringPreferences.enabledVolcanoLayerIds"
            :loading-volcano-layer-ids="monitoringPreferences.loadingVolcanoLayerIds"
            @toggle-fault-layer="monitoringPreferences.toggleFaultLayer"
            @toggle-trench-layer="monitoringPreferences.toggleTrenchLayer"
            @toggle-volcano-layer="monitoringPreferences.toggleVolcanoLayer"
          />
        </div>
      </div>
      <div class="mt-4 h-px w-full bg-slate-200" />
      <div class="mt-4">
        <MapSummaryCards
          :total-events="totalEvents"
          :significant-events="significantEvents"
          :largest-magnitude="largestMagnitude"
        />
      </div>
    </div>
    <NewEarthquakeAlert
      :model-value="isAlertOpen"
      :earthquakes="alertEarthquakes"
      :newly-added-ids="newlyAddedIds"
      @update:model-value="onNewEarthquakeModalChange"
      @dismiss="dismissNewEarthquakeAlert"
      @locate="onLocateOnMap"
    />
    <WarningAlert
      v-if="hasWarning"
      :message="warning ?? ''"
      dismissible
      @dismiss="clearWarning"
    />
    <ErrorAlert
      v-if="hasError"
      :message="error ?? 'Unknown error'"
      dismissible
      @dismiss="clearError"
    />
    <EarthquakeMap
      ref="mapRef"
      :earthquakes="earthquakes"
      :loading="loading"
      :refreshing="refreshing"
      :user-location="monitoringPreferences.nearMeActive ? monitoringPreferences.userLocation : null"
      :near-me-radius-km="monitoringPreferences.nearMeActive ? monitoringPreferences.radiusKm : null"
      :group-markers="monitoringPreferences.groupMarkers"
      :show-plate-boundaries="monitoringPreferences.showPlateBoundaries"
      :enabled-fault-layer-ids="monitoringPreferences.enabledFaultLayerIds"
      :loading-fault-layer-ids="monitoringPreferences.loadingFaultLayerIds"
      :enabled-trench-layer-ids="monitoringPreferences.enabledTrenchLayerIds"
      :loading-trench-layer-ids="monitoringPreferences.loadingTrenchLayerIds"
      :enabled-volcano-layer-ids="monitoringPreferences.enabledVolcanoLayerIds"
      :loading-volcano-layer-ids="monitoringPreferences.loadingVolcanoLayerIds"
      :newly-added-ids="newlyAddedIds"
      :data-source="dataSource"
    >
      <template #overlay-bottom-left>
        <div class="pointer-events-auto">
          <MapMagnitudeLegend
            :show-plate-boundaries="monitoringPreferences.showPlateBoundaries"
            :show-fault-lines="monitoringPreferences.enabledFaultLayerIds.length > 0"
            :show-trenches="monitoringPreferences.enabledTrenchLayerIds.length > 0"
            :show-volcanoes="monitoringPreferences.enabledVolcanoLayerIds.length > 0"
          />
        </div>
      </template>
    </EarthquakeMap>
    <AppEmptyState
      v-if="!loading && earthquakes.length === 0"
      title="No earthquake events to display"
      :description="`Map markers will appear when ${getDataSourceLabel(dataSource)} reports new activity.`"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onActivated, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import type { Earthquake } from '@earthquake/shared-types';
import AppEmptyState from '@/components/AppEmptyState.vue';
import EarthquakeMap from '@/components/EarthquakeMap.vue';
import ErrorAlert from '@/components/ErrorAlert.vue';
import WarningAlert from '@/components/WarningAlert.vue';
import MapGeologyLayersControl from '@/components/MapGeologyLayersControl.vue';
import MapMagnitudeLegend from '@/components/MapMagnitudeLegend.vue';
import MapSummaryCards from '@/components/MapSummaryCards.vue';
import MapToolbar from '@/components/MapToolbar.vue';
import NewEarthquakeAlert from '@/components/NewEarthquakeAlert.vue';
import RefreshIndicator from '@/components/RefreshIndicator.vue';
import { useEarthquakeMapPolling } from '@/composables/useEarthquakeMapPolling';
import { useMapSummary } from '@/composables/useMapSummary';
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';
import { getDataSourceLabel, getTimeRangeLabel, isPhivolcsSource } from '@earthquake/shared-utils';
import { useEarthquakeStore } from '@/stores/earthquakeStore';
import { useMonitoringPreferencesStore } from '@/stores/monitoringPreferencesStore';

const earthquakeStore = useEarthquakeStore();
const monitoringPreferences = useMonitoringPreferencesStore();
const { earthquakes, loading, refreshing, error, warning, hasError, hasWarning } = storeToRefs(earthquakeStore);
const { loadLatestForMap, loadStats, clearError, clearWarning } = earthquakeStore;
const mapRef = ref<InstanceType<typeof EarthquakeMap> | null>(null);
const { totalEvents, significantEvents, largestMagnitude } = useMapSummary(earthquakes);
const {
  isAlertOpen,
  alertEarthquakes,
  newlyAddedIds,
  dismissNewEarthquakeAlert,
} = useEarthquakeMapPolling({
  earthquakes,
  mapRef,
  loadLatestForMap,
  loadStats,
});

const dataSource = computed(() => earthquakeStore.filters.dataSource ?? 'usgs');
const timeRangeLabel = computed(() => getTimeRangeLabel(earthquakeStore.filters.timeRange ?? '24h').toLowerCase());
const mapTitle = computed(() => (
  isPhivolcsSource(dataSource.value) ? 'Philippine Earthquake Map' : 'Global Earthquake Map'
));
const mapSubtitle = computed(() => (
  `Interactive map of ${getDataSourceLabel(dataSource.value)} seismic events from ${timeRangeLabel.value}`
));
function focusPhilippinesIfNeeded(): void {
  if (!isPhivolcsSource(dataSource.value)) return;
  window.setTimeout(() => mapRef.value?.focusPhilippinesView?.(), 200);
}

watch(dataSource, () => {
  focusPhilippinesIfNeeded();
});

onActivated(() => {
  focusPhilippinesIfNeeded();
});

function onNewEarthquakeModalChange(open: boolean): void {
  if (!open) dismissNewEarthquakeAlert();
}

function onFitAll(): void {
  mapRef.value?.fitBounds?.();
}

function onResetView(): void {
  mapRef.value?.resetView?.();
}

function onLocateOnMap(earthquake: Earthquake): void {
  mapRef.value?.locateEarthquake?.(earthquake);
}
</script>
