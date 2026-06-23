import type {
  DashboardStats,
  Earthquake,
  EarthquakeDataSource,
  EarthquakeFilters,
  EarthquakeTimeRange,
  PaginatedData,
  TimeRangeCoverage,
} from '@earthquake/shared-types';
import {
  isCriticalEarthquake,
  isSignificantMagnitude,
  isWithinRadiusKm,
  resolveTimeRangeEarthquakes,
} from '@earthquake/shared-utils';
import { PhivolcsEarthquakeRepository } from '../repositories/PhivolcsEarthquakeRepository.js';
import { UsgsEarthquakeRepository } from '../repositories/UsgsEarthquakeRepository.js';
import { EarthquakeDataUnavailableError, NotFoundError } from '../types/errors.js';

export class EarthquakeService {
  constructor(
    private readonly usgsRepository: UsgsEarthquakeRepository,
    private readonly phivolcsRepository: PhivolcsEarthquakeRepository
  ) {}

  async getLatest(filters?: EarthquakeFilters): Promise<PaginatedData<Earthquake>> {
    const dataSource = filters?.dataSource ?? 'usgs';
    const timeRange = filters?.timeRange ?? '24h';
    const { earthquakes, coverage } = await this.fetchEarthquakesForTimeRange(timeRange, dataSource);
    const paginated = this.applyFilters(earthquakes, filters);
    return { ...paginated, timeRangeCoverage: coverage };
  }

  async getSignificant(filters?: EarthquakeFilters): Promise<PaginatedData<Earthquake>> {
    const earthquakes = await this.usgsRepository.getSignificant();
    return this.applyFilters(earthquakes, filters);
  }

  async getByMinimumMagnitude(
    minMagnitude: number,
    filters?: EarthquakeFilters
  ): Promise<PaginatedData<Earthquake>> {
    const earthquakes = await this.usgsRepository.getByMinimumMagnitude(minMagnitude);
    return this.applyFilters(earthquakes, filters);
  }

  async getById(id: string): Promise<Earthquake> {
    const repository = id.startsWith('phivolcs:')
      ? this.phivolcsRepository
      : this.usgsRepository;
    const earthquake = await repository.getById(id);
    if (!earthquake) {
      throw new NotFoundError(`Earthquake with id ${id} not found`);
    }
    return earthquake;
  }

  async getDashboardStats(
    timeRange: EarthquakeTimeRange = '24h',
    dataSource: EarthquakeDataSource = 'usgs'
  ): Promise<DashboardStats> {
    const { earthquakes, coverage } = await this.fetchEarthquakesForTimeRange(timeRange, dataSource);
    const magnitudes = earthquakes
      .map((eq) => eq.magnitude)
      .filter((mag): mag is number => mag !== null);

    const totalEarthquakes = earthquakes.length;
    const largestMagnitude = magnitudes.length > 0 ? Math.max(...magnitudes) : 0;
    const averageMagnitude =
      magnitudes.length > 0
        ? magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length
        : 0;
    const significantEvents = earthquakes.filter((eq) =>
      isSignificantMagnitude(eq.magnitude)
    ).length;

    const sortedByTime = [...earthquakes].sort((a, b) => b.time - a.time);
    const latest = sortedByTime[0];

    return {
      totalEarthquakes,
      largestMagnitude,
      averageMagnitude: Number(averageMagnitude.toFixed(2)),
      significantEvents,
      latestEarthquake: latest
        ? {
            id: latest.id,
            magnitude: latest.magnitude,
            place: latest.place,
            time: latest.time,
          }
        : null,
      timeRangeCoverage: coverage,
    };
  }

  private async fetchEarthquakesForTimeRange(
    timeRange: EarthquakeTimeRange,
    dataSource: EarthquakeDataSource
  ): Promise<{ earthquakes: Earthquake[]; coverage: TimeRangeCoverage }> {
    const repository = this.getRepository(dataSource);
    const result = await repository.getByTimeRange(timeRange);
    if (result.earthquakes.length === 0) {
      throw new EarthquakeDataUnavailableError(
        this.buildUnavailableMessage(timeRange, dataSource)
      );
    }
    return resolveTimeRangeEarthquakes({
      earthquakes: result.earthquakes,
      timeRange,
      dataSource,
      isTruncated: result.isTruncated,
      truncationLimit: result.truncationLimit,
    });
  }

  private buildUnavailableMessage(
    timeRange: EarthquakeTimeRange,
    dataSource: EarthquakeDataSource
  ): string {
    const sourceLabel = dataSource === 'phivolcs' ? 'PHIVOLCS' : 'USGS';
    return `No earthquake events are available from ${sourceLabel} for the selected ${timeRange} time range.`;
  }

  private getRepository(dataSource: EarthquakeDataSource) {
    return dataSource === 'phivolcs' ? this.phivolcsRepository : this.usgsRepository;
  }

  private applyFilters(
    earthquakes: Earthquake[],
    filters?: EarthquakeFilters
  ): PaginatedData<Earthquake> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const sortBy = filters?.sortBy ?? 'time';
    const sortOrder = filters?.sortOrder ?? 'desc';
    const search = filters?.search?.trim().toLowerCase();
    const minMagnitude = filters?.minMagnitude;
    const maxMagnitude = filters?.maxMagnitude;
    const criticalOnly = filters?.criticalOnly;
    const nearLatitude = filters?.nearLatitude;
    const nearLongitude = filters?.nearLongitude;
    const radiusKm = filters?.radiusKm;

    let filtered = [...earthquakes];

    if (search) {
      filtered = filtered.filter(
        (eq) =>
          eq.place.toLowerCase().includes(search) ||
          eq.id.toLowerCase().includes(search) ||
          eq.title.toLowerCase().includes(search)
      );
    }

    if (minMagnitude !== undefined) {
      filtered = filtered.filter((eq) => (eq.magnitude ?? 0) >= minMagnitude);
    }

    if (maxMagnitude !== undefined) {
      filtered = filtered.filter((eq) => (eq.magnitude ?? 0) <= maxMagnitude);
    }

    if (criticalOnly) {
      filtered = filtered.filter((eq) => isCriticalEarthquake(eq));
    }

    if (
      nearLatitude !== undefined &&
      nearLongitude !== undefined &&
      radiusKm !== undefined
    ) {
      filtered = filtered.filter((eq) =>
        isWithinRadiusKm(nearLatitude, nearLongitude, eq.latitude, eq.longitude, radiusKm)
      );
    }

    filtered.sort((a, b) => {
      const aValue = sortBy === 'magnitude' ? (a.magnitude ?? 0) : a.time;
      const bValue = sortBy === 'magnitude' ? (b.magnitude ?? 0) : b.time;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      pagination: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPreviousPage: safePage > 1,
      },
    };
  }
}
