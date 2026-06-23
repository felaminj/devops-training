import { nextTick, onUnmounted, watch, type Ref } from 'vue';
import L from 'leaflet';
import type { Earthquake } from '@earthquake/shared-types';
import { getMagnitudeHexColor } from '@earthquake/shared-utils';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors';
const WORLD_BOUNDS: L.LatLngBoundsExpression = [[-85, -180], [85, 180]];

function getMarkerRadius(magnitude: number | null): number {
  if (magnitude === null) return 7;
  return Math.max(7, Math.min(14, magnitude * 2));
}

export function useModalEarthquakeMap(
  mapContainer: Ref<HTMLElement | null>,
  earthquakes: Ref<Earthquake[]>,
  focusEarthquake: Ref<Earthquake | null>,
  isActive: Ref<boolean>
) {
  let map: L.Map | null = null;
  let markerLayer: L.LayerGroup | null = null;

  function renderMarkers(): void {
    if (!map || !markerLayer) return;
    markerLayer.clearLayers();
    earthquakes.value.forEach((earthquake) => {
      const color = getMagnitudeHexColor(earthquake.magnitude);
      const marker = L.circleMarker([earthquake.latitude, earthquake.longitude], {
        radius: getMarkerRadius(earthquake.magnitude),
        color: '#ffffff',
        fillColor: color,
        fillOpacity: 0.95,
        weight: 2,
      });
      markerLayer?.addLayer(marker);
    });
  }

  function focusMap(): void {
    if (!map || earthquakes.value.length === 0) return;
    const target = focusEarthquake.value ?? earthquakes.value[0];
    if (!target) return;
    if (earthquakes.value.length === 1) {
      map.setView([target.latitude, target.longitude], 6);
      return;
    }
    const bounds = L.latLngBounds(
      earthquakes.value.map((eq) => [eq.latitude, eq.longitude] as [number, number])
    );
    map.fitBounds(bounds.pad(0.2), { maxZoom: 6 });
  }

  function initMap(): void {
    if (!mapContainer.value || map) return;
    map = L.map(mapContainer.value, {
      zoomControl: false,
      attributionControl: false,
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
    markerLayer = L.layerGroup().addTo(map);
    renderMarkers();
    focusMap();
    window.setTimeout(() => map?.invalidateSize(), 50);
    window.setTimeout(() => map?.invalidateSize(), 250);
  }

  function destroyMap(): void {
    if (!map) return;
    map.remove();
    map = null;
    markerLayer = null;
  }

  async function syncMap(): Promise<void> {
    if (!isActive.value) return;
    await nextTick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (!map) initMap();
    renderMarkers();
    focusMap();
    map?.invalidateSize();
  }

  watch([earthquakes, focusEarthquake], () => {
    if (!isActive.value || !map) return;
    renderMarkers();
    focusMap();
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
