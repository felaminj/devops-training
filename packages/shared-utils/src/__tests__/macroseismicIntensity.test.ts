import { describe, expect, it } from 'vitest';
import type { Earthquake } from '@earthquake/shared-types';
import {
  buildMacroseismicIntensityMap,
  parseMacroseismicObservations,
} from '../macroseismicIntensity.js';

const baseEarthquake: Earthquake = {
  id: 'eq-1',
  magnitude: 5.4,
  place: 'Test',
  time: Date.now(),
  latitude: 14,
  longitude: 121,
  depth: 10,
  url: null,
  tsunami: false,
  significance: 500,
  status: 'reviewed',
  magType: 'mw',
  title: 'M 5.4 - Test',
  dataSource: 'phivolcs',
};

describe('macroseismicIntensity', () => {
  it('parses PHIVOLCS instrumental intensity observations', () => {
    const observations = parseMacroseismicObservations(
      'Intensity V - City of Manila, NCR; Intensity IV - Quezon City, NCR'
    );
    expect(observations).toHaveLength(2);
    expect(observations[0]?.intensityLevel).toBe(5);
    expect(observations[1]?.place).toContain('Quezon');
  });

  it('builds concentric intensity zones for an earthquake', () => {
    const map = buildMacroseismicIntensityMap({
      ...baseEarthquake,
      instrumentalIntensity: 'Intensity VI - Sample City, LAGUNA',
    });
    expect(map.zones.length).toBeGreaterThan(2);
    expect(map.peakIntensityLevel).toBe(6);
    expect(map.observations).toHaveLength(1);
    expect(map.zones[0]?.radiusKm).toBeLessThan(map.zones[1]?.radiusKm ?? 0);
  });
});
