import type { Earthquake } from '@earthquake/shared-types';
import { isWithinRadiusKm } from './geo.js';

export type SoundAlertFilter = {
  minMagnitude: number;
  nearMeActive: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  radiusKm: number;
};

type SoundAlertEarthquake = Pick<Earthquake, 'magnitude' | 'latitude' | 'longitude'>;

export function matchesSoundAlertCriteria(
  earthquake: SoundAlertEarthquake,
  filter: SoundAlertFilter
): boolean {
  const magnitude = earthquake.magnitude ?? 0;
  if (magnitude < filter.minMagnitude) return false;
  if (!filter.nearMeActive || !filter.userLocation) return true;
  return isWithinRadiusKm(
    filter.userLocation.latitude,
    filter.userLocation.longitude,
    earthquake.latitude,
    earthquake.longitude,
    filter.radiusKm
  );
}
