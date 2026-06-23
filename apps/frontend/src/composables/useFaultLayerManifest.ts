import { FAULT_LAYERS_INDEX_URL } from '@/constants/faultLayers';
import { useGeoLayerManifest } from '@/composables/useGeoLayerManifest';

export function useFaultLayerManifest() {
  return useGeoLayerManifest(FAULT_LAYERS_INDEX_URL);
}
