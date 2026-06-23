import { describe, expect, it } from 'vitest';
import { matchesSoundAlertCriteria } from '../soundAlert.js';

describe('matchesSoundAlertCriteria', () => {
  const earthquake = {
    magnitude: 5.2,
    latitude: 14.5,
    longitude: 121,
  };

  it('matches when magnitude is at or above the threshold', () => {
    expect(matchesSoundAlertCriteria(earthquake, {
      minMagnitude: 5,
      nearMeActive: false,
      userLocation: null,
      radiusKm: 500,
    })).toBe(true);
    expect(matchesSoundAlertCriteria(earthquake, {
      minMagnitude: 6,
      nearMeActive: false,
      userLocation: null,
      radiusKm: 500,
    })).toBe(false);
  });

  it('respects near me radius when enabled', () => {
    expect(matchesSoundAlertCriteria(earthquake, {
      minMagnitude: 5,
      nearMeActive: true,
      userLocation: { latitude: 14.6, longitude: 121.1 },
      radiusKm: 100,
    })).toBe(true);
    expect(matchesSoundAlertCriteria(earthquake, {
      minMagnitude: 5,
      nearMeActive: true,
      userLocation: { latitude: 10, longitude: 125 },
      radiusKm: 100,
    })).toBe(false);
  });
});
