import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { EarthquakeDataSource, EarthquakeFilters } from '@earthquake/shared-types';
import { isPhivolcsSource } from '@earthquake/shared-utils';
import { DEFAULT_FAULT_LAYER_ID } from '@/constants/faultLayers';
import { DEFAULT_TRENCH_LAYER_ID } from '@/constants/trenchLayers';
import { DEFAULT_VOLCANO_LAYER_ID } from '@/constants/volcanoLayers';
import {
  DEFAULT_NEAR_ME_RADIUS_KM,
  DEFAULT_SOUND_ALERT_MIN_MAGNITUDE,
} from '@/constants/monitoring';

export type UserLocation = {
  latitude: number;
  longitude: number;
};

export const useMonitoringPreferencesStore = defineStore('monitoringPreferences', () => {
  const criticalOnly = ref(false);
  const nearMeEnabled = ref(false);
  const userLocation = ref<UserLocation | null>(null);
  const radiusKm = ref(DEFAULT_NEAR_ME_RADIUS_KM);
  const notificationsEnabled = ref(false);
  const soundAlertsEnabled = ref(false);
  const soundAlertMinMagnitude = ref(DEFAULT_SOUND_ALERT_MIN_MAGNITUDE);
  const groupMarkers = ref(true);
  const showPlateBoundaries = ref(true);
  const enabledFaultLayerIds = ref<string[]>([DEFAULT_FAULT_LAYER_ID]);
  const loadingFaultLayerIds = ref<string[]>([]);
  const enabledTrenchLayerIds = ref<string[]>([DEFAULT_TRENCH_LAYER_ID]);
  const loadingTrenchLayerIds = ref<string[]>([]);
  const enabledVolcanoLayerIds = ref<string[]>([DEFAULT_VOLCANO_LAYER_ID]);
  const loadingVolcanoLayerIds = ref<string[]>([]);
  const locationError = ref<string | null>(null);

  const hasUserLocation = computed(() => userLocation.value !== null);
  const nearMeActive = computed(() => nearMeEnabled.value && hasUserLocation.value);

  function toEarthquakeFilters(): Partial<EarthquakeFilters> {
    const filters: Partial<EarthquakeFilters> = {};
    if (criticalOnly.value) filters.criticalOnly = true;
    if (nearMeActive.value && userLocation.value) {
      filters.nearLatitude = userLocation.value.latitude;
      filters.nearLongitude = userLocation.value.longitude;
      filters.radiusKm = radiusKm.value;
    }
    return filters;
  }

  function setUserLocation(location: UserLocation): void {
    userLocation.value = location;
    locationError.value = null;
  }

  function clearLocationError(): void {
    locationError.value = null;
  }

  function setLocationError(message: string): void {
    locationError.value = message;
  }

  function toggleFaultLayer(layerId: string): void {
    if (enabledFaultLayerIds.value.includes(layerId)) {
      enabledFaultLayerIds.value = enabledFaultLayerIds.value.filter((id) => id !== layerId);
      return;
    }
    enabledFaultLayerIds.value = [...enabledFaultLayerIds.value, layerId];
  }

  function toggleTrenchLayer(layerId: string): void {
    if (enabledTrenchLayerIds.value.includes(layerId)) {
      enabledTrenchLayerIds.value = enabledTrenchLayerIds.value.filter((id) => id !== layerId);
      return;
    }
    enabledTrenchLayerIds.value = [...enabledTrenchLayerIds.value, layerId];
  }

  function toggleVolcanoLayer(layerId: string): void {
    if (enabledVolcanoLayerIds.value.includes(layerId)) {
      enabledVolcanoLayerIds.value = enabledVolcanoLayerIds.value.filter((id) => id !== layerId);
      return;
    }
    enabledVolcanoLayerIds.value = [...enabledVolcanoLayerIds.value, layerId];
  }

  function syncGeologyLayersForDataSource(dataSource: EarthquakeDataSource): void {
    enabledFaultLayerIds.value = [DEFAULT_FAULT_LAYER_ID];
    if (isPhivolcsSource(dataSource)) {
      enabledTrenchLayerIds.value = [];
      enabledVolcanoLayerIds.value = [];
      return;
    }
    enabledTrenchLayerIds.value = [DEFAULT_TRENCH_LAYER_ID];
    enabledVolcanoLayerIds.value = [DEFAULT_VOLCANO_LAYER_ID];
  }

  return {
    criticalOnly,
    nearMeEnabled,
    userLocation,
    radiusKm,
    notificationsEnabled,
    soundAlertsEnabled,
    soundAlertMinMagnitude,
    groupMarkers,
    showPlateBoundaries,
    enabledFaultLayerIds,
    loadingFaultLayerIds,
    enabledTrenchLayerIds,
    loadingTrenchLayerIds,
    enabledVolcanoLayerIds,
    loadingVolcanoLayerIds,
    locationError,
    hasUserLocation,
    nearMeActive,
    toEarthquakeFilters,
    setUserLocation,
    clearLocationError,
    setLocationError,
    toggleFaultLayer,
    toggleTrenchLayer,
    toggleVolcanoLayer,
    syncGeologyLayersForDataSource,
  };
});
