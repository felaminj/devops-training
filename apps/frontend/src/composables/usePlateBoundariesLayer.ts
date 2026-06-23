import L from 'leaflet';
import type { Ref } from 'vue';
import { PLATE_BOUNDARIES_URL, PLATE_BOUNDARY_STYLE } from '@/constants/mapLayers';

type GeoJsonFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry>;

let cachedPlateBoundaries: GeoJsonFeatureCollection | null = null;

async function fetchPlateBoundaries(): Promise<GeoJsonFeatureCollection> {
  if (cachedPlateBoundaries) return cachedPlateBoundaries;
  const response = await fetch(PLATE_BOUNDARIES_URL);
  if (!response.ok) throw new Error('Failed to load plate boundaries');
  const data = await response.json() as GeoJsonFeatureCollection;
  cachedPlateBoundaries = data;
  return data;
}

export async function createPlateBoundariesLayer(): Promise<L.GeoJSON> {
  const data = await fetchPlateBoundaries();
  return L.geoJSON(data, { style: PLATE_BOUNDARY_STYLE });
}

export async function syncPlateBoundariesLayer(
  map: L.Map | null,
  layerRef: { current: L.GeoJSON | null },
  isVisible: Ref<boolean>
): Promise<void> {
  if (!map) return;
  if (layerRef.current) {
    map.removeLayer(layerRef.current);
    layerRef.current = null;
  }
  if (!isVisible.value) return;
  const layer = await createPlateBoundariesLayer();
  layer.addTo(map);
  layer.eachLayer((featureLayer) => {
    if (featureLayer instanceof L.Path) featureLayer.bringToBack();
  });
  layerRef.current = layer;
}
