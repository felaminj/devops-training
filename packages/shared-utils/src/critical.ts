import type { Earthquake } from '@earthquake/shared-types';
import { isSignificantMagnitude } from './magnitude.js';

type CriticalEarthquake = Pick<Earthquake, 'magnitude' | 'tsunami'>;

export function isCriticalEarthquake(earthquake: CriticalEarthquake): boolean {
  return earthquake.tsunami || isSignificantMagnitude(earthquake.magnitude);
}
