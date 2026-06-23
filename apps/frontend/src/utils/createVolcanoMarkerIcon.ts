import L from 'leaflet';
import { VOLCANO_MARKER_STYLES } from '@/constants/volcanoLayers';
import type { VolcanoClassification } from '@/types/geoLayers';

const VOLCANO_ICON_SIZES: Record<VolcanoClassification, number> = {
  active: 24,
  potentially_active: 22,
  dormant: 20,
};

function buildMountainSvg(classification: VolcanoClassification): string {
  const style = VOLCANO_MARKER_STYLES[classification];
  const size = VOLCANO_ICON_SIZES[classification];
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">
      <path
        d="M3 21 L10 8 L14 14 L18 6 L21 21 Z"
        fill="${style.fillColor}"
        stroke="${style.color}"
        stroke-width="${style.weight}"
        stroke-linejoin="round"
      />
      <path d="M10 8 L14 14 L12 14 Z" fill="#ffffff" fill-opacity="0.35" />
    </svg>
  `;
}

export function createVolcanoMarkerIcon(classification: VolcanoClassification): L.DivIcon {
  const size = VOLCANO_ICON_SIZES[classification];
  const anchorY = size - 2;
  return L.divIcon({
    className: 'volcano-marker-icon',
    html: buildMountainSvg(classification),
    iconSize: [size, size],
    iconAnchor: [size / 2, anchorY],
    popupAnchor: [0, -anchorY + 4],
  });
}
