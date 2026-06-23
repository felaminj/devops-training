import { onMounted, ref } from 'vue';
import { fetchGeoLayerManifest } from '@/composables/useGeoJsonMapLayers';
import type { GeoLayerManifest } from '@/types/geoLayers';

export function useGeoLayerManifest(indexUrl: string) {
  const manifest = ref<GeoLayerManifest | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadManifest(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      manifest.value = await fetchGeoLayerManifest(indexUrl);
    } catch (loadError) {
      error.value = loadError instanceof Error ? loadError.message : 'Failed to load layer catalog';
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    void loadManifest();
  });

  return { manifest, loading, error, loadManifest };
}
