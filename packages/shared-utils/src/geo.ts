const EARTH_RADIUS_KM = 6371;

export type GeoBoundsCorner = {
  latitude: number;
  longitude: number;
};

export type GeoBounds = {
  southWest: GeoBoundsCorner;
  northEast: GeoBoundsCorner;
};

export const PHILIPPINES_BOUNDS: GeoBounds = {
  southWest: { latitude: 4.5, longitude: 116 },
  northEast: { latitude: 21.2, longitude: 127 },
};

export const PHILIPPINES_MAP_CENTER = {
  latitude: 12.5,
  longitude: 122,
} as const;

export const PHILIPPINES_DEFAULT_ZOOM = 6;

const DEFAULT_GLOBAL_LNG_SPAN_THRESHOLD = 150;
const DEFAULT_GLOBAL_LAT_SPAN_THRESHOLD = 80;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinRadiusKm(
  centerLatitude: number,
  centerLongitude: number,
  pointLatitude: number,
  pointLongitude: number,
  radiusKm: number
): boolean {
  return haversineDistanceKm(
    centerLatitude,
    centerLongitude,
    pointLatitude,
    pointLongitude
  ) <= radiusKm;
}

export function isGloballySpreadEvents(
  events: Array<{ latitude: number; longitude: number }>,
  lngSpanThreshold = DEFAULT_GLOBAL_LNG_SPAN_THRESHOLD,
  latSpanThreshold = DEFAULT_GLOBAL_LAT_SPAN_THRESHOLD
): boolean {
  if (events.length === 0) return true;
  const lngs = events.map((event) => event.longitude);
  const lats = events.map((event) => event.latitude);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  return lngSpan > lngSpanThreshold || latSpan > latSpanThreshold;
}
