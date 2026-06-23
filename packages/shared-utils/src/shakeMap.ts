import type { GeoBounds } from './geo.js';

export type ShakeMapLegendColumn = {
  intensity: string;
  shaking: string;
  damage: string;
  pga: string;
  pgv: string;
  color: string;
};

const SHAKEMAP_COLOR_STOPS: { level: number; color: string }[] = [
  { level: 1, color: '#ffffff' },
  { level: 2.5, color: '#bfccff' },
  { level: 4, color: '#7fffd4' },
  { level: 5, color: '#7fff00' },
  { level: 6, color: '#ffff00' },
  { level: 7, color: '#ffcc00' },
  { level: 8, color: '#ff9900' },
  { level: 9, color: '#ff0000' },
  { level: 10.5, color: '#7f0000' },
];

export const SHAKEMAP_LEGEND_COLUMNS: ShakeMapLegendColumn[] = [
  { intensity: 'I', shaking: 'Not felt', damage: 'None', pga: '<0.1', pgv: '<0.1', color: '#ffffff' },
  { intensity: 'II-III', shaking: 'Weak', damage: 'Very light', pga: '0.1-1.1', pgv: '0.1-1.4', color: '#bfccff' },
  { intensity: 'IV', shaking: 'Light', damage: 'Light', pga: '1.1-3.4', pgv: '1.4-4.4', color: '#7fffd4' },
  { intensity: 'V', shaking: 'Moderate', damage: 'Moderate', pga: '3.4-9.1', pgv: '4.4-12', color: '#7fff00' },
  { intensity: 'VI', shaking: 'Strong', damage: 'Moderate', pga: '9.1-23', pgv: '12-31', color: '#ffff00' },
  { intensity: 'VII', shaking: 'Very strong', damage: 'Moderate/heavy', pga: '23-59', pgv: '31-80', color: '#ffcc00' },
  { intensity: 'VIII', shaking: 'Severe', damage: 'Heavy', pga: '59-153', pgv: '80-208', color: '#ff9900' },
  { intensity: 'IX', shaking: 'Violent', damage: 'Very heavy', pga: '153-397', pgv: '208-539', color: '#ff0000' },
  { intensity: 'X+', shaking: 'Extreme', damage: 'Very heavy', pga: '397+', pgv: '539+', color: '#7f0000' },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => Math.round(value).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function interpolateShakeMapColor(intensityLevel: number): string {
  const level = Math.min(10.5, Math.max(1, intensityLevel));
  let lower = SHAKEMAP_COLOR_STOPS[0];
  let upper = SHAKEMAP_COLOR_STOPS[SHAKEMAP_COLOR_STOPS.length - 1];
  for (let index = 0; index < SHAKEMAP_COLOR_STOPS.length - 1; index += 1) {
    const current = SHAKEMAP_COLOR_STOPS[index];
    const next = SHAKEMAP_COLOR_STOPS[index + 1];
    if (current && next && level >= current.level && level <= next.level) {
      lower = current;
      upper = next;
      break;
    }
  }
  if (!lower || !upper || lower.level === upper.level) return lower?.color ?? '#ffffff';
  const ratio = (level - lower.level) / (upper.level - lower.level);
  const start = hexToRgb(lower.color);
  const end = hexToRgb(upper.color);
  return rgbToHex(
    start.r + (end.r - start.r) * ratio,
    start.g + (end.g - start.g) * ratio,
    start.b + (end.b - start.b) * ratio
  );
}

export function estimateShakeMapIntensity(
  distanceKm: number,
  peakLevel: number,
  depthKm: number
): number {
  if (distanceKm <= 0.5) return peakLevel;
  const attenuation = 1.75 * Math.log10(1 + distanceKm / Math.max(4, depthKm * 0.75 + 5));
  return Math.max(1, peakLevel - attenuation);
}

export function getShakeMapBounds(
  latitude: number,
  longitude: number,
  radiusKm: number
): GeoBounds {
  const latDelta = radiusKm / 111;
  const lngScale = Math.cos((latitude * Math.PI) / 180);
  const lngDelta = radiusKm / Math.max(0.35, 111 * lngScale);
  return {
    southWest: { latitude: latitude - latDelta, longitude: longitude - lngDelta },
    northEast: { latitude: latitude + latDelta, longitude: longitude + lngDelta },
  };
}

export function getShakeMapColorForLevel(level: number): string {
  return interpolateShakeMapColor(level);
}
