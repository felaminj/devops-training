export function formatCoordinates(latitude: number, longitude: number, precision = 4): string {
  const lat = latitude.toFixed(precision);
  const lng = longitude.toFixed(precision);
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lngDir = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(Number(lat))}°${latDir}, ${Math.abs(Number(lng))}°${lngDir}`;
}

export function formatDepth(depthKm: number, precision = 1): string {
  return `${depthKm.toFixed(precision)} km`;
}

export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}
