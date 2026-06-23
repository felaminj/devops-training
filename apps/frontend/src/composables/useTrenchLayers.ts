import type { Ref } from 'vue';
import L from 'leaflet';
import { syncGeoJsonMapLayers } from '@/composables/useGeoJsonMapLayers';
import { TRENCH_LAYERS_INDEX_URL, TRENCH_LINE_STYLE } from '@/constants/trenchLayers';

export async function syncTrenchLayers(
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
    TRENCH_LAYERS_INDEX_URL,
    { style: TRENCH_LINE_STYLE }
  );
}
