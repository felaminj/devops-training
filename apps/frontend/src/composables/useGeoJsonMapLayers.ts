import L from 'leaflet';
import type { Ref } from 'vue';
import type { GeoLayerManifest, GeoLayerManifestEntry } from '@/types/geoLayers';

type GeoJsonFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry>;

type GeoJsonLayerOptions = {
  style?: L.PathOptions | ((feature?: GeoJSON.Feature) => L.PathOptions);
  pointToLayer?: (feature: GeoJSON.Feature, latlng: L.LatLng) => L.Layer;
  onEachFeature?: (feature: GeoJSON.Feature, layer: L.Layer) => void;
};

const manifestCache = new Map<string, GeoLayerManifest>();
const dataCache = new Map<string, GeoJsonFeatureCollection>();

export async function fetchGeoLayerManifest(indexUrl: string): Promise<GeoLayerManifest> {
  const cached = manifestCache.get(indexUrl);
  if (cached) return cached;
  const response = await fetch(indexUrl);
  if (!response.ok) throw new Error('Failed to load geology layer catalog');
  const data = await response.json() as GeoLayerManifest;
  manifestCache.set(indexUrl, data);
  return data;
}

async function fetchGeoLayerData(file: string): Promise<GeoJsonFeatureCollection> {
  const cached = dataCache.get(file);
  if (cached) return cached;
  const response = await fetch(file);
  if (!response.ok) throw new Error(`Failed to load geology data from ${file}`);
  const data = await response.json() as GeoJsonFeatureCollection;
  dataCache.set(file, data);
  return data;
}

function findManifestEntry(
  manifest: GeoLayerManifest,
  layerId: string
): GeoLayerManifestEntry | undefined {
  return manifest.layers.find((layer) => layer.id === layerId);
}

function sendLayerToBack(layer: L.GeoJSON): void {
  layer.eachLayer((featureLayer) => {
    if (featureLayer instanceof L.Path) featureLayer.bringToBack();
  });
}

export async function syncGeoJsonMapLayers(
  map: L.Map | null,
  activeLayers: Map<string, L.GeoJSON>,
  enabledLayerIds: Ref<string[]>,
  loadingLayerIds: Ref<string[]>,
  indexUrl: string,
  layerOptions: GeoJsonLayerOptions
): Promise<void> {
  if (!map) return;

  const enabledSet = new Set(enabledLayerIds.value);
  for (const [layerId, layer] of activeLayers.entries()) {
    if (enabledSet.has(layerId)) continue;
    map.removeLayer(layer);
    activeLayers.delete(layerId);
  }

  if (enabledLayerIds.value.length === 0) return;

  const manifest = await fetchGeoLayerManifest(indexUrl);

  for (const layerId of enabledLayerIds.value) {
    if (activeLayers.has(layerId)) continue;
    const entry = findManifestEntry(manifest, layerId);
    if (!entry) continue;

    loadingLayerIds.value = [...loadingLayerIds.value, layerId];
    try {
      const data = await fetchGeoLayerData(entry.file);
      const layer = L.geoJSON(data, layerOptions);
      layer.addTo(map);
      sendLayerToBack(layer);
      activeLayers.set(layerId, layer);
    } finally {
      loadingLayerIds.value = loadingLayerIds.value.filter((id) => id !== layerId);
    }
  }
}
