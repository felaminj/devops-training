import { describe, expect, it } from 'vitest';
import type { Earthquake } from '@earthquake/shared-types';
import { resolveTimeRangeEarthquakes } from '../timeRangeCoverage.js';

const recentEvent: Earthquake = {
  id: 'eq-recent',
  magnitude: 4.1,
  place: 'Test Place',
  time: Date.now() - 2 * 60 * 60 * 1000,
  latitude: 14,
  longitude: 121,
  depth: 10,
  url: null,
  tsunami: false,
  significance: 100,
  status: 'reviewed',
  magType: 'ml',
  title: 'M 4.1 - Test Place',
  dataSource: 'phivolcs',
};

describe('resolveTimeRangeEarthquakes', () => {
  it('falls back to all available events when none match the requested range', () => {
    const staleEvent = { ...recentEvent, time: Date.now() - 2 * 24 * 60 * 60 * 1000 };
    const result = resolveTimeRangeEarthquakes({
      earthquakes: [staleEvent],
      timeRange: '24h',
      dataSource: 'phivolcs',
    });
    expect(result.earthquakes).toHaveLength(1);
    expect(result.coverage.isPartialCoverage).toBe(true);
    expect(result.coverage.message).toContain('Showing');
  });

  it('does not warn for 24h when archive data reaches before the requested start', () => {
    const now = Date.now();
    const events: Earthquake[] = [
      { ...recentEvent, id: 'eq-old', time: now - 20 * 60 * 60 * 1000 },
      { ...recentEvent, id: 'eq-new', time: now - 2 * 60 * 60 * 1000 },
    ];
    const result = resolveTimeRangeEarthquakes({
      earthquakes: events,
      timeRange: '24h',
      dataSource: 'phivolcs',
    });
    expect(result.earthquakes).toHaveLength(2);
    expect(result.coverage.isPartialCoverage).toBe(false);
    expect(result.coverage.message).toBeNull();
  });

  it('marks USGS results as truncated when the fetch limit is reached', () => {
    const result = resolveTimeRangeEarthquakes({
      earthquakes: [recentEvent],
      timeRange: '100y',
      dataSource: 'usgs',
      isTruncated: true,
      truncationLimit: 50000,
    });
    expect(result.coverage.isTruncated).toBe(true);
    expect(result.coverage.message).toContain('50,000');
  });
});
