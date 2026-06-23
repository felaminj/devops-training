import { nextTick, onUnmounted, watch, type Ref } from 'vue';
import L from 'leaflet';
import type { Earthquake, GeoBounds, IntensityMapPayload } from '@earthquake/shared-types';
import { resolveIntensityImageUrl } from '@/services/intensityMapService';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors';
const WORLD_BOUNDS: L.LatLngBoundsExpression = [[-85, -180], [85, 180]];

function toLeafletBounds(bounds: GeoBounds): L.LatLngBoundsExpression {
  return [
    [bounds.southWest.latitude, bounds.southWest.longitude],
    [bounds.northEast.latitude, bounds.northEast.longitude],
  ];
}

export function useIntensityModalMap(
  mapContainer: Ref<HTMLElement | null>,
  earthquake: Ref<Earthquake | null>,
  intensityPayload: Ref<IntensityMapPayload | null>,
  isActive: Ref<boolean>
) {
  let map: L.Map | null = null;
  let intensityLayer: L.LayerGroup | null = null;

  function renderIntensityLayer(): void {
    if (!map || !intensityLayer || !earthquake.value || !intensityPayload.value) return;
    const payload = intensityPayload.value;
    if (!payload.imageUrl || !payload.bounds) return;
    intensityLayer.clearLayers();
    const imageUrl = resolveIntensityImageUrl(payload.imageUrl);
    const overlay = L.imageOverlay(imageUrl, toLeafletBounds(payload.bounds), {
      opacity: payload.source === 'phivolcs-official' ? 0.88 : 0.72,
      interactive: false,
      className: 'shakemap-intensity-overlay',
    });
    intensityLayer.addLayer(overlay);
    const icon = L.divIcon({
      className: 'shakemap-epicenter-icon',
      html: '<span class="shakemap-epicenter-star" aria-hidden="true">★</span>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const marker = L.marker(
      [earthquake.value.latitude, earthquake.value.longitude],
      { icon, interactive: false, zIndexOffset: 1200 }
    );
    intensityLayer.addLayer(marker);
    map.fitBounds(toLeafletBounds(payload.bounds), { maxZoom: 10, padding: [20, 20] });
  }

  function initMap(): void {
    if (!mapContainer.value || map) return;
    map = L.map(mapContainer.value, {
      zoomControl: true,
      attributionControl: true,
      worldCopyJump: false,
      maxBounds: WORLD_BOUNDS,
      maxBoundsViscosity: 1,
      minZoom: 2,
    });
    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      noWrap: true,
      bounds: WORLD_BOUNDS,
    }).addTo(map);
    intensityLayer = L.layerGroup().addTo(map);
    renderIntensityLayer();
    window.setTimeout(() => map?.invalidateSize(), 50);
    window.setTimeout(() => map?.invalidateSize(), 250);
  }

  function destroyMap(): void {
    if (!map) return;
    map.remove();
    map = null;
    intensityLayer = null;
  }

  async function syncMap(): Promise<void> {
    if (!isActive.value || !intensityPayload.value) return;
    await nextTick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (!map) initMap();
    renderIntensityLayer();
    map?.invalidateSize();
  }

  watch([earthquake, intensityPayload], () => {
    if (!isActive.value || !map) return;
    renderIntensityLayer();
  }, { deep: true });

  watch(isActive, (active) => {
    if (active) void syncMap();
    else destroyMap();
  }, { immediate: true });

  onUnmounted(() => {
    destroyMap();
  });

  return { syncMap };
}
