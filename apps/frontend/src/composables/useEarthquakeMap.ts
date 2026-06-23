import { nextTick, onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { Earthquake, EarthquakeDataSource } from '@earthquake/shared-types';
import {
  getMagnitudeHexColor,
  isGloballySpreadEvents,
  isPhivolcsSource,
  PHILIPPINES_BOUNDS,
  PHILIPPINES_DEFAULT_ZOOM,
  PHILIPPINES_MAP_CENTER,
} from '@earthquake/shared-utils';
import { syncFaultLayers } from '@/composables/useFaultLayers';
import { syncPlateBoundariesLayer } from '@/composables/usePlateBoundariesLayer';
import { syncTrenchLayers } from '@/composables/useTrenchLayers';
import { syncVolcanoLayers } from '@/composables/useVolcanoLayers';

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors';
const WORLD_BOUNDS: L.LatLngBoundsExpression = [[-85, -180], [85, 180]];
const PHILIPPINES_MIN_ZOOM = 5;
const PHILIPPINES_MAX_ZOOM = 11;

function getMarkerRadius(magnitude: number | null): number {
  if (magnitude === null) return 6;
  return Math.max(6, Math.min(16, magnitude * 2.2));
}

function toLeafletBounds(bounds: typeof PHILIPPINES_BOUNDS): L.LatLngBoundsExpression {
  return [
    [bounds.southWest.latitude, bounds.southWest.longitude],
    [bounds.northEast.latitude, bounds.northEast.longitude],
  ];
}

const PHILIPPINES_MAP_BOUNDS = toLeafletBounds(PHILIPPINES_BOUNDS);

function setWorldView(targetMap: L.Map): void {
  targetMap.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
}

function setPhilippinesView(targetMap: L.Map): void {
  targetMap.fitBounds(PHILIPPINES_MAP_BOUNDS, { maxZoom: PHILIPPINES_DEFAULT_ZOOM });
}

type UserLocation = {
  latitude: number;
  longitude: number;
};

export function useEarthquakeMap(
  mapContainer: Ref<HTMLElement | null>,
  earthquakes: Ref<Earthquake[]>,
  userLocation?: Ref<UserLocation | null>,
  nearMeRadiusKm?: Ref<number | null>,
  groupMarkers?: Ref<boolean>,
  showPlateBoundaries?: Ref<boolean>,
  enabledFaultLayerIds?: Ref<string[]>,
  loadingFaultLayerIds?: Ref<string[]>,
  enabledTrenchLayerIds?: Ref<string[]>,
  loadingTrenchLayerIds?: Ref<string[]>,
  enabledVolcanoLayerIds?: Ref<string[]>,
  loadingVolcanoLayerIds?: Ref<string[]>,
  newlyAddedIds?: Ref<string[]>,
  dataSource?: Ref<EarthquakeDataSource>,
  onPinClick?: (earthquake: Earthquake) => void
) {
  const fallbackLocation = ref<UserLocation | null>(null);
  const fallbackRadius = ref<number | null>(null);
  const fallbackGroupMarkers = ref(true);
  const fallbackShowPlateBoundaries = ref(true);
  const fallbackEnabledFaultLayerIds = ref<string[]>([]);
  const fallbackLoadingFaultLayerIds = ref<string[]>([]);
  const fallbackEnabledTrenchLayerIds = ref<string[]>([]);
  const fallbackLoadingTrenchLayerIds = ref<string[]>([]);
  const fallbackEnabledVolcanoLayerIds = ref<string[]>([]);
  const fallbackLoadingVolcanoLayerIds = ref<string[]>([]);
  const fallbackNewlyAddedIds = ref<string[]>([]);
  const fallbackDataSource = ref<EarthquakeDataSource>('usgs');
  const locationRef = userLocation ?? fallbackLocation;
  const radiusRef = nearMeRadiusKm ?? fallbackRadius;
  const groupMarkersRef = groupMarkers ?? fallbackGroupMarkers;
  const showPlateBoundariesRef = showPlateBoundaries ?? fallbackShowPlateBoundaries;
  const enabledFaultLayerIdsRef = enabledFaultLayerIds ?? fallbackEnabledFaultLayerIds;
  const loadingFaultLayerIdsRef = loadingFaultLayerIds ?? fallbackLoadingFaultLayerIds;
  const enabledTrenchLayerIdsRef = enabledTrenchLayerIds ?? fallbackEnabledTrenchLayerIds;
  const loadingTrenchLayerIdsRef = loadingTrenchLayerIds ?? fallbackLoadingTrenchLayerIds;
  const enabledVolcanoLayerIdsRef = enabledVolcanoLayerIds ?? fallbackEnabledVolcanoLayerIds;
  const loadingVolcanoLayerIdsRef = loadingVolcanoLayerIds ?? fallbackLoadingVolcanoLayerIds;
  const newlyAddedIdsRef = newlyAddedIds ?? fallbackNewlyAddedIds;
  const dataSourceRef = dataSource ?? fallbackDataSource;
  let map: L.Map | null = null;
  let hasAutoFitForSource = false;
  let markerLayer: L.LayerGroup | L.MarkerClusterGroup | null = null;
  let plateBoundariesLayer: L.GeoJSON | null = null;
  const plateLayerRef = { current: null as L.GeoJSON | null };
  const faultLayers = new Map<string, L.GeoJSON>();
  const trenchLayers = new Map<string, L.GeoJSON>();
  const volcanoLayers = new Map<string, L.GeoJSON>();
  let userLayer: L.LayerGroup | null = null;
  let resizeObserver: ResizeObserver | null = null;

  function isNewlyAdded(earthquakeId: string): boolean {
    return newlyAddedIdsRef.value.includes(earthquakeId);
  }

  function createMarker(earthquake: Earthquake): L.Layer {
    const color = getMagnitudeHexColor(earthquake.magnitude);
    const radius = getMarkerRadius(earthquake.magnitude);
    const latlng: L.LatLngExpression = [earthquake.latitude, earthquake.longitude];
    const isNew = isNewlyAdded(earthquake.id);
    const marker = L.circleMarker(latlng, {
      radius,
      color: isNew ? '#fbbf24' : '#ffffff',
      fillColor: color,
      fillOpacity: 0.9,
      weight: isNew ? 3 : 2,
      opacity: 0.9,
      className: isNew ? 'earthquake-marker-new' : '',
    });
    if (!isNew) {
      bindPinClick(marker, earthquake);
      return marker;
    }
    const pulseRing = L.circleMarker(latlng, {
      radius: radius + 8,
      color,
      fillColor: color,
      fillOpacity: 0.2,
      weight: 2,
      opacity: 0.55,
      className: 'earthquake-marker-pulse-ring',
      interactive: false,
    });
    const markerGroup = L.layerGroup([pulseRing, marker]);
    bindPinClick(markerGroup, earthquake);
    return markerGroup;
  }

  function bindPinClick(layer: L.Layer, earthquake: Earthquake): void {
    if (layer instanceof L.LayerGroup) {
      layer.getLayers().forEach((child) => bindPinClick(child, earthquake));
      return;
    }
    layer.on('click', () => {
      map?.closePopup();
      onPinClick?.(earthquake);
    });
  }

  function renderUserLocation(): void {
    if (!map) return;
    if (!userLayer) userLayer = L.layerGroup().addTo(map);
    userLayer.clearLayers();
    if (!locationRef.value) return;
    const { latitude, longitude } = locationRef.value;
    const youAreHere = L.circleMarker([latitude, longitude], {
      radius: 8,
      color: '#ffffff',
      fillColor: '#2563eb',
      fillOpacity: 1,
      weight: 2,
    });
    youAreHere.bindTooltip('Your location');
    userLayer.addLayer(youAreHere);
    if (radiusRef.value && radiusRef.value > 0) {
      const radiusCircle = L.circle([latitude, longitude], {
        radius: radiusRef.value * 1000,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 1,
      });
      userLayer.addLayer(radiusCircle);
    }
  }

  function clearMarkerLayer(): void {
    if (!map || !markerLayer) return;
    map.removeLayer(markerLayer);
    markerLayer = null;
  }

  function createMarkerLayer(): L.LayerGroup | L.MarkerClusterGroup {
    if (groupMarkersRef.value) {
      return L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
      });
    }
    return L.layerGroup();
  }

  function renderMarkers(): void {
    if (!map) return;
    clearMarkerLayer();
    markerLayer = createMarkerLayer();
    map.addLayer(markerLayer);
    earthquakes.value.forEach((earthquake) => {
      markerLayer?.addLayer(createMarker(earthquake));
    });
  }

  function refreshLayout(): void {
    map?.invalidateSize();
  }

  function applyMapRegionForDataSource(): void {
    if (!map) return;
    if (isPhivolcsSource(dataSourceRef.value)) {
      map.setMaxBounds(PHILIPPINES_MAP_BOUNDS);
      map.setMinZoom(PHILIPPINES_MIN_ZOOM);
      return;
    }
    map.setMaxBounds(WORLD_BOUNDS);
    map.setMinZoom(2);
  }

  function getInitialMapView(): { center: [number, number]; zoom: number } {
    if (isPhivolcsSource(dataSourceRef.value)) {
      return {
        center: [PHILIPPINES_MAP_CENTER.latitude, PHILIPPINES_MAP_CENTER.longitude],
        zoom: PHILIPPINES_DEFAULT_ZOOM,
      };
    }
    return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
  }

  async function initMap(): Promise<void> {
    if (!mapContainer.value || map) return;
    const initialView = getInitialMapView();
    const initialMaxBounds = isPhivolcsSource(dataSourceRef.value)
      ? PHILIPPINES_MAP_BOUNDS
      : WORLD_BOUNDS;
    const initialMinZoom = isPhivolcsSource(dataSourceRef.value) ? PHILIPPINES_MIN_ZOOM : 2;
    map = L.map(mapContainer.value, {
      zoomControl: false,
      worldCopyJump: false,
      maxBounds: initialMaxBounds,
      maxBoundsViscosity: 1,
      minZoom: initialMinZoom,
    }).setView(initialView.center, initialView.zoom);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      noWrap: true,
      bounds: WORLD_BOUNDS,
    }).addTo(map);
    await syncPlateBoundaries();
    await syncGeologyLayersOnMap();
    renderMarkers();
    renderUserLocation();
    refreshLayout();
  }

  async function syncPlateBoundaries(): Promise<void> {
    plateLayerRef.current = plateBoundariesLayer;
    await syncPlateBoundariesLayer(map, plateLayerRef, showPlateBoundariesRef);
    plateBoundariesLayer = plateLayerRef.current;
  }

  async function syncGeologyLayersOnMap(): Promise<void> {
    await syncFaultLayers(map, faultLayers, enabledFaultLayerIdsRef, loadingFaultLayerIdsRef);
    await syncTrenchLayers(map, trenchLayers, enabledTrenchLayerIdsRef, loadingTrenchLayerIdsRef);
    await syncVolcanoLayers(map, volcanoLayers, enabledVolcanoLayerIdsRef, loadingVolcanoLayerIdsRef);
  }

  function scheduleLayoutRefresh(): void {
    window.setTimeout(() => refreshLayout(), 100);
    window.setTimeout(() => refreshLayout(), 350);
    window.setTimeout(() => refreshLayout(), 700);
  }

  async function setupMap(): Promise<void> {
    await nextTick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await initMap();
    applyMapRegionForDataSource();
    fitMapToCurrentSource();
    hasAutoFitForSource = true;
    scheduleLayoutRefresh();
  }

  function fitPhilippinesBounds(): void {
    if (!map) return;
    applyMapRegionForDataSource();
    if (earthquakes.value.length === 0) {
      setPhilippinesView(map);
      refreshLayout();
      return;
    }
    const eventBounds = L.latLngBounds(
      earthquakes.value.map((eq) => [eq.latitude, eq.longitude] as [number, number])
    );
    map.fitBounds(eventBounds.pad(0.12), { maxZoom: PHILIPPINES_MAX_ZOOM });
    refreshLayout();
  }

  function fitUsgsBounds(): void {
    if (!map || earthquakes.value.length === 0) return;
    if (isGloballySpreadEvents(earthquakes.value)) {
      setWorldView(map);
      refreshLayout();
      return;
    }
    const bounds = L.latLngBounds(
      earthquakes.value.map((eq) => [eq.latitude, eq.longitude] as [number, number])
    );
    map.fitBounds(bounds.pad(0.1), { maxZoom: 8 });
    refreshLayout();
  }

  function fitBounds(): void {
    if (!map) return;
    if (isPhivolcsSource(dataSourceRef.value)) {
      fitPhilippinesBounds();
      return;
    }
    fitUsgsBounds();
  }

  function resetView(): void {
    if (!map) return;
    if (isPhivolcsSource(dataSourceRef.value)) {
      setPhilippinesView(map);
      refreshLayout();
      return;
    }
    setWorldView(map);
    refreshLayout();
  }

  function fitMapToCurrentSource(): void {
    if (!map) return;
    applyMapRegionForDataSource();
    if (isPhivolcsSource(dataSourceRef.value)) {
      fitPhilippinesBounds();
      return;
    }
    if (earthquakes.value.length === 0) {
      setWorldView(map);
      refreshLayout();
      return;
    }
    fitUsgsBounds();
  }

  function focusPhilippinesView(): void {
    if (!map) return;
    applyMapRegionForDataSource();
    fitPhilippinesBounds();
  }

  function locateEarthquake(earthquake: Earthquake): void {
    if (!map) return;
    map.setView([earthquake.latitude, earthquake.longitude], 8, { animate: true });
    refreshLayout();
  }

  function handleResize(): void {
    refreshLayout();
  }

  onMounted(() => {
    void setupMap();
    window.addEventListener('resize', handleResize);
    const container = mapContainer.value;
    const parent = container?.parentElement;
    if (container) {
      resizeObserver = new ResizeObserver(() => refreshLayout());
      resizeObserver.observe(container);
      if (parent) resizeObserver.observe(parent);
    }
  });

  watch(earthquakes, (events) => {
    renderMarkers();
    refreshLayout();
    if (!map || hasAutoFitForSource || events.length === 0) return;
    hasAutoFitForSource = true;
    fitMapToCurrentSource();
  }, { deep: true });

  watch(dataSourceRef, () => {
    hasAutoFitForSource = false;
    if (!map) return;
    window.setTimeout(() => {
      if (!map) return;
      fitMapToCurrentSource();
      hasAutoFitForSource = true;
      scheduleLayoutRefresh();
    }, 150);
  });

  watch(newlyAddedIdsRef, () => {
    renderMarkers();
    refreshLayout();
  }, { deep: true });

  watch([locationRef, radiusRef], () => {
    renderUserLocation();
    refreshLayout();
  }, { deep: true });

  watch(groupMarkersRef, () => {
    renderMarkers();
    refreshLayout();
  });

  watch(showPlateBoundariesRef, () => {
    void syncPlateBoundaries();
  });

  watch(enabledFaultLayerIdsRef, () => {
    void syncGeologyLayersOnMap();
  }, { deep: true });

  watch(enabledTrenchLayerIdsRef, () => {
    void syncGeologyLayersOnMap();
  }, { deep: true });

  watch(enabledVolcanoLayerIdsRef, () => {
    void syncGeologyLayersOnMap();
  }, { deep: true });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    resizeObserver?.disconnect();
    if (map) {
      map.remove();
      map = null;
    }
    markerLayer = null;
    plateBoundariesLayer = null;
    plateLayerRef.current = null;
    faultLayers.clear();
    trenchLayers.clear();
    volcanoLayers.clear();
    userLayer = null;
  });

  return {
    fitBounds,
    resetView,
    refreshLayout,
    locateEarthquake,
    focusPhilippinesView,
  };
}
