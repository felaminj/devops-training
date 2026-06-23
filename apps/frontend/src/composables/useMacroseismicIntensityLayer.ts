import L from 'leaflet';
import type { GeoBounds } from '@earthquake/shared-types';
import type { MacroseismicIntensityMapData } from '@earthquake/shared-utils';
import {
  formatCoordinates,
  formatMagnitude,
  formatTimestamp,
  getShakeMapBounds,
} from '@earthquake/shared-utils';
import { resolveIntensityImageUrl } from '@/services/intensityMapService';
import { createShakeMapCanvas } from '@/utils/createShakeMapCanvas';

function toLeafletBounds(bounds: GeoBounds): L.LatLngBoundsExpression {
  return [
    [bounds.southWest.latitude, bounds.southWest.longitude],
    [bounds.northEast.latitude, bounds.northEast.longitude],
  ];
}

function createEpicenterMarker(mapData: MacroseismicIntensityMapData): L.Marker {
  const { latitude, longitude } = mapData.epicenter;
  const icon = L.divIcon({
    className: 'shakemap-epicenter-icon',
    html: '<span class="shakemap-epicenter-star" aria-hidden="true">★</span>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
  const marker = L.marker([latitude, longitude], { icon, zIndexOffset: 1200, interactive: false });
  marker.bindTooltip('Epicenter', { permanent: false, direction: 'top' });
  return marker;
}

function createIntensityOverlay(mapData: MacroseismicIntensityMapData): L.ImageOverlay {
  if (mapData.officialImageUrl && mapData.officialBounds) {
    const imageUrl = resolveIntensityImageUrl(mapData.officialImageUrl);
    return L.imageOverlay(imageUrl, toLeafletBounds(mapData.officialBounds), {
      opacity: mapData.mapSource === 'phivolcs-official' ? 0.88 : 0.72,
      interactive: false,
      className: 'shakemap-intensity-overlay',
    });
  }
  const { dataUrl, bounds } = createShakeMapCanvas(mapData);
  return L.imageOverlay(dataUrl, bounds, {
    opacity: 0.72,
    interactive: false,
    className: 'shakemap-intensity-overlay',
  });
}

export function fitMacroseismicIntensityBounds(
  map: L.Map,
  mapData: MacroseismicIntensityMapData
): void {
  if (mapData.officialBounds) {
    map.fitBounds(toLeafletBounds(mapData.officialBounds), { maxZoom: 10, padding: [24, 24] });
    return;
  }
  const bounds = getShakeMapBounds(
    mapData.epicenter.latitude,
    mapData.epicenter.longitude,
    mapData.outerRadiusKm
  );
  map.fitBounds(toLeafletBounds(bounds), { maxZoom: 10, padding: [24, 24] });
}

export function renderMacroseismicIntensityLayer(
  map: L.Map,
  mapData: MacroseismicIntensityMapData
): L.LayerGroup {
  const layer = L.layerGroup();
  layer.addLayer(createIntensityOverlay(mapData));
  layer.addLayer(createEpicenterMarker(mapData));
  layer.addTo(map);
  return layer;
}

export function buildIntensityMapHeadline(mapData: MacroseismicIntensityMapData): string {
  const magnitude = formatMagnitude(mapData.magnitude);
  return `M ${magnitude} · ${mapData.place}`;
}

export function buildIntensityMapMetaLine(mapData: MacroseismicIntensityMapData): string {
  const coords = formatCoordinates(mapData.epicenter.latitude, mapData.epicenter.longitude);
  return `${formatTimestamp(mapData.time)} · ${coords} · ${mapData.depthKm.toFixed(0)} km`;
}

export function buildIntensityMapSourceBadge(mapData: MacroseismicIntensityMapData): string {
  if (mapData.mapSource === 'phivolcs-official') return 'PHIVOLCS';
  if (mapData.mapSource === 'usgs-shakemap') return 'ShakeMap';
  return 'Estimated';
}

export function buildIntensityMapSourceBadgeClass(mapData: MacroseismicIntensityMapData): string {
  if (mapData.mapSource === 'phivolcs-official') return 'bg-emerald-100 text-emerald-800';
  if (mapData.mapSource === 'usgs-shakemap') return 'bg-blue-100 text-blue-800';
  return 'bg-amber-100 text-amber-800';
}

export function buildMacroseismicPanelTitle(mapData: MacroseismicIntensityMapData): string {
  return buildIntensityMapHeadline(mapData);
}

export function buildMacroseismicPanelSubtitle(mapData: MacroseismicIntensityMapData): string {
  return buildIntensityMapMetaLine(mapData);
}
