import type {
  Earthquake,
  EarthquakeDataSource,
  GeoBounds,
  IntensityMapPayload,
  IntensityMapSourceType,
  MacroseismicObservation,
} from '@earthquake/shared-types';
import { getDataSourceLabel } from './dataSource.js';
import { haversineDistanceKm } from './geo.js';
import {
  estimateShakeMapIntensity,
  getShakeMapColorForLevel,
  interpolateShakeMapColor,
  SHAKEMAP_LEGEND_COLUMNS,
} from './shakeMap.js';

export type MacroseismicIntensityZone = {
  level: number;
  roman: string;
  label: string;
  color: string;
  radiusKm: number;
};

export type MacroseismicIntensityMapData = {
  epicenter: { latitude: number; longitude: number };
  place: string;
  time: number;
  eventId: string;
  magnitude: number | null;
  depthKm: number;
  peakIntensityLevel: number;
  peakIntensityRoman: string;
  outerRadiusKm: number;
  zones: MacroseismicIntensityZone[];
  observations: MacroseismicObservation[];
  dataSource: EarthquakeDataSource;
  sourceLabel: string;
  mapSource: IntensityMapSourceType;
  officialImageUrl: string | null;
  officialBounds: GeoBounds | null;
  attribution: string;
  isModeled: boolean;
  note: string;
};

const INTENSITY_ROMAN_LEVELS = [
  { level: 12, roman: 'XII', label: 'Extreme' },
  { level: 11, roman: 'XI', label: 'Extreme' },
  { level: 10, roman: 'X', label: 'Extreme' },
  { level: 9, roman: 'IX', label: 'Violent' },
  { level: 8, roman: 'VIII', label: 'Severe' },
  { level: 7, roman: 'VII', label: 'Very strong' },
  { level: 6, roman: 'VI', label: 'Strong' },
  { level: 5, roman: 'V', label: 'Moderate' },
  { level: 4, roman: 'IV', label: 'Light' },
  { level: 3, roman: 'III', label: 'Weak' },
  { level: 2, roman: 'II', label: 'Very weak' },
  { level: 1, roman: 'I', label: 'Not felt' },
] as const;

const ROMAN_PATTERN = /^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)$/i;

export function getMacroseismicIntensityColor(level: number): string {
  return getShakeMapColorForLevel(level);
}

export function intensityLevelToRoman(level: number): string {
  const match = INTENSITY_ROMAN_LEVELS.find((item) => item.level === Math.round(level));
  return match?.roman ?? 'I';
}

export function intensityRomanToLevel(roman: string): number | null {
  const normalized = roman.trim().toUpperCase();
  if (!ROMAN_PATTERN.test(normalized)) return null;
  const match = INTENSITY_ROMAN_LEVELS.find((item) => item.roman === normalized);
  return match?.level ?? null;
}

export function parseMacroseismicObservations(value: string | null | undefined): MacroseismicObservation[] {
  if (!value?.trim()) return [];
  const observations: MacroseismicObservation[] = [];
  const pattern = /Intensity\s+([IVX]+)\s*[-–]\s*([^,;]+)/gi;
  let match = pattern.exec(value);
  while (match) {
    const intensityRoman = (match[1] ?? '').toUpperCase();
    const place = (match[2] ?? '').trim();
    const intensityLevel = intensityRomanToLevel(intensityRoman);
    if (place && intensityLevel !== null) {
      observations.push({ place, intensityRoman, intensityLevel });
    }
    match = pattern.exec(value);
  }
  return observations;
}

function estimatePeakIntensityLevel(earthquake: Earthquake): number {
  const observations = parseMacroseismicObservations(earthquake.instrumentalIntensity);
  if (observations.length > 0) {
    return Math.max(...observations.map((item) => item.intensityLevel));
  }
  if (earthquake.mmi !== null && earthquake.mmi !== undefined) {
    return Math.min(12, Math.max(1, Math.round(earthquake.mmi)));
  }
  if (earthquake.cdi !== null && earthquake.cdi !== undefined) {
    return Math.min(12, Math.max(1, Math.round(earthquake.cdi)));
  }
  if (earthquake.magnitude === null) return 3;
  return Math.min(12, Math.max(1, Math.round(3.3 + 1.4 * earthquake.magnitude)));
}

function estimateRadiusKm(peakLevel: number, targetLevel: number, depthKm: number): number {
  let radiusKm = 2;
  while (radiusKm < 800) {
    const intensity = estimateShakeMapIntensity(radiusKm, peakLevel, depthKm);
    if (intensity <= targetLevel) return radiusKm;
    radiusKm += 2;
  }
  return radiusKm;
}

function buildIntensityZones(peakLevel: number, depthKm: number): MacroseismicIntensityZone[] {
  const minLevel = Math.max(1, peakLevel - 6);
  const zones: MacroseismicIntensityZone[] = [];
  for (let level = peakLevel; level >= minLevel; level -= 1) {
    const meta = INTENSITY_ROMAN_LEVELS.find((item) => item.level === level);
    zones.push({
      level,
      roman: meta?.roman ?? intensityLevelToRoman(level),
      label: meta?.label ?? 'Unknown',
      color: getMacroseismicIntensityColor(level),
      radiusKm: estimateRadiusKm(peakLevel, level, depthKm),
    });
  }
  return zones;
}

export function estimateIntensityAtCoordinate(
  mapData: MacroseismicIntensityMapData,
  latitude: number,
  longitude: number
): number {
  const distanceKm = haversineDistanceKm(
    mapData.epicenter.latitude,
    mapData.epicenter.longitude,
    latitude,
    longitude
  );
  return estimateShakeMapIntensity(distanceKm, mapData.peakIntensityLevel, mapData.depthKm);
}

export function buildMacroseismicIntensityMap(earthquake: Earthquake): MacroseismicIntensityMapData {
  const observations = parseMacroseismicObservations(earthquake.instrumentalIntensity);
  const peakIntensityLevel = estimatePeakIntensityLevel(earthquake);
  const dataSource = earthquake.dataSource ?? 'usgs';
  const zones = buildIntensityZones(peakIntensityLevel, earthquake.depth);
  const outerRadiusKm = zones[zones.length - 1]?.radiusKm ?? 40;
  const isModeled = observations.length === 0 && earthquake.mmi == null && earthquake.cdi == null;
  const note = isModeled
    ? 'Modeled Shakemap-style contours estimated from magnitude and depth. Not an official USGS or PHIVOLCS ShakeMap product.'
    : observations.length > 0
      ? 'Modeled Shakemap-style contours with reported instrumental intensities listed below.'
      : 'Modeled Shakemap-style contours using reported shaking metrics and earthquake parameters.';
  return {
    epicenter: { latitude: earthquake.latitude, longitude: earthquake.longitude },
    place: earthquake.place,
    time: earthquake.time,
    eventId: earthquake.id,
    magnitude: earthquake.magnitude,
    depthKm: earthquake.depth,
    peakIntensityLevel,
    peakIntensityRoman: intensityLevelToRoman(peakIntensityLevel),
    outerRadiusKm,
    zones,
    observations,
    dataSource,
    sourceLabel: getDataSourceLabel(dataSource),
    mapSource: 'modeled',
    officialImageUrl: earthquake.epicentralMapUrl ?? null,
    officialBounds: null,
    attribution: 'Modeled contours (not an official ShakeMap product)',
    isModeled,
    note,
  };
}

export function mergeIntensityMapPayload(
  mapData: MacroseismicIntensityMapData,
  payload: IntensityMapPayload
): MacroseismicIntensityMapData {
  return {
    ...mapData,
    observations: payload.observations.length > 0 ? payload.observations : mapData.observations,
    peakIntensityRoman: payload.peakIntensityRoman,
    mapSource: payload.source,
    officialImageUrl: payload.imageUrl,
    officialBounds: payload.bounds,
    sourceLabel: payload.sourceLabel,
    note: payload.note,
    attribution: payload.attribution,
    isModeled: payload.source === 'modeled',
  };
}

export const MACROSEISMIC_INTENSITY_LEGEND = SHAKEMAP_LEGEND_COLUMNS;
export { interpolateShakeMapColor, SHAKEMAP_LEGEND_COLUMNS };
