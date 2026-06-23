import { describe, expect, it, vi } from 'vitest';
import type { Earthquake } from '@earthquake/shared-types';
import { EarthquakeService } from '../services/EarthquakeService.js';
import { EarthquakeDataUnavailableError } from '../types/errors.js';
import type { PhivolcsEarthquakeRepository } from '../repositories/PhivolcsEarthquakeRepository.js';
import type { UsgsEarthquakeRepository } from '../repositories/UsgsEarthquakeRepository.js';

const mockEarthquakes: Earthquake[] = [
  {
    id: 'eq1',
    magnitude: 4.5,
    place: 'California',
    time: 1000,
    latitude: 36.7,
    longitude: -121.3,
    depth: 10,
    url: null,
    tsunami: false,
    significance: 300,
    status: 'reviewed',
    magType: 'ml',
    title: 'M 4.5 - California',
    dataSource: 'usgs',
  },
  {
    id: 'eq2',
    magnitude: 6.2,
    place: 'Japan',
    time: 2000,
    latitude: 35.6,
    longitude: 139.7,
    depth: 20,
    url: null,
    tsunami: true,
    significance: 700,
    status: 'reviewed',
    magType: 'mw',
    title: 'M 6.2 - Japan',
    dataSource: 'usgs',
  },
];

const phivolcsEarthquakes: Earthquake[] = [
  {
    id: 'phivolcs:2026_0609_1607_B2F',
    magnitude: 2.9,
    place: 'Santo Domingo (Albay)',
    time: 3000,
    latitude: 13.26,
    longitude: 123.88,
    depth: 3,
    url: 'https://earthquake.phivolcs.dost.gov.ph/example.html',
    tsunami: false,
    significance: 290,
    status: 'reviewed',
    magType: 'Ms',
    title: 'M 2.9 - Santo Domingo (Albay)',
    dataSource: 'phivolcs',
    instrumentalIntensity: 'Intensity III - City of Legazpi, ALBAY',
    expectingDamage: false,
    expectingAftershocks: false,
    origin: 'TECTONIC',
  },
];

function createUsgsRepositoryMock(): UsgsEarthquakeRepository {
  const rangeResult = { earthquakes: mockEarthquakes, isTruncated: false };
  return {
    getLatest: vi.fn().mockResolvedValue(rangeResult),
    getByTimeRange: vi.fn().mockResolvedValue(rangeResult),
    getSignificant: vi.fn().mockResolvedValue([mockEarthquakes[1]]),
    getByMinimumMagnitude: vi.fn().mockResolvedValue([mockEarthquakes[1]]),
    getById: vi.fn().mockResolvedValue(mockEarthquakes[0]),
  } as unknown as UsgsEarthquakeRepository;
}

function createPhivolcsRepositoryMock(): PhivolcsEarthquakeRepository {
  const rangeResult = { earthquakes: phivolcsEarthquakes, isTruncated: false };
  return {
    getLatest: vi.fn().mockResolvedValue(rangeResult),
    getByTimeRange: vi.fn().mockResolvedValue(rangeResult),
    getById: vi.fn().mockResolvedValue(phivolcsEarthquakes[0]),
  } as unknown as PhivolcsEarthquakeRepository;
}

describe('EarthquakeService', () => {
  it('calculates dashboard stats from USGS data', async () => {
    const service = new EarthquakeService(createUsgsRepositoryMock(), createPhivolcsRepositoryMock());
    const stats = await service.getDashboardStats('24h', 'usgs');
    expect(stats.totalEarthquakes).toBe(2);
    expect(stats.largestMagnitude).toBe(6.2);
    expect(stats.significantEvents).toBe(1);
    expect(stats.latestEarthquake?.id).toBe('eq2');
  });

  it('uses PHIVOLCS repository when dataSource is phivolcs', async () => {
    const phivolcsRepository = createPhivolcsRepositoryMock();
    const service = new EarthquakeService(createUsgsRepositoryMock(), phivolcsRepository);
    const result = await service.getLatest({ dataSource: 'phivolcs', page: 1, pageSize: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.dataSource).toBe('phivolcs');
    expect(phivolcsRepository.getByTimeRange).toHaveBeenCalled();
  });

  it('filters and paginates earthquakes', async () => {
    const service = new EarthquakeService(createUsgsRepositoryMock(), createPhivolcsRepositoryMock());
    const result = await service.getLatest({
      search: 'japan',
      sortBy: 'magnitude',
      sortOrder: 'desc',
      page: 1,
      pageSize: 10,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('eq2');
  });

  it('returns partial coverage metadata for PHIVOLCS 100y requests', async () => {
    const service = new EarthquakeService(createUsgsRepositoryMock(), createPhivolcsRepositoryMock());
    const result = await service.getLatest({ dataSource: 'phivolcs', timeRange: '100y', page: 1, pageSize: 10 });
    expect(result.timeRangeCoverage?.isPartialCoverage).toBe(true);
    expect(result.timeRangeCoverage?.message).toContain('PHIVOLCS');
  });

  it('throws when a source returns no earthquake events', async () => {
    const emptyPhivolcsRepository = {
      getLatest: vi.fn().mockResolvedValue({ earthquakes: [], isTruncated: false }),
      getByTimeRange: vi.fn().mockResolvedValue({ earthquakes: [], isTruncated: false }),
      getById: vi.fn().mockResolvedValue(null),
    } as unknown as PhivolcsEarthquakeRepository;
    const service = new EarthquakeService(createUsgsRepositoryMock(), emptyPhivolcsRepository);
    await expect(service.getLatest({ dataSource: 'phivolcs', timeRange: '100y' })).rejects.toBeInstanceOf(
      EarthquakeDataUnavailableError
    );
  });
});
