import L from 'leaflet';
import type { Ref } from 'vue';
import { syncGeoJsonMapLayers, fetchGeoLayerManifest } from '@/composables/useGeoJsonMapLayers';
import { FAULT_LAYERS_INDEX_URL, FAULT_LINE_STYLE } from '@/constants/faultLayers';
import type { GeoLayerManifest } from '@/types/geoLayers';

export async function fetchFaultLayerManifest(): Promise<GeoLayerManifest> {
  return fetchGeoLayerManifest(FAULT_LAYERS_INDEX_URL);
}

export async function syncFaultLayers(
  map: L.Map | null,
  activeLayers: Map<string, L.GeoJSON>,
  enabledLayerIds: Ref<string[]>,
  loadingLayerIds: Ref<string[]>
): Promise<void> {
  await syncGeoJsonMapLayers(
    map,
    activeLayers,
    enabledLayerIds,
    loadingLayerIds,
    FAULT_LAYERS_INDEX_URL,
    { style: FAULT_LINE_STYLE }
  );
}
