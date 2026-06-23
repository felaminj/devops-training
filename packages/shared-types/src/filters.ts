import type { EarthquakeDataSource } from './dataSource.js';
import type { EarthquakeTimeRange } from './timeRange.js';
import type { TimeRangeCoverage } from './timeRangeCoverage.js';

export type SortField = 'time' | 'magnitude';
export type SortOrder = 'asc' | 'desc';

export interface EarthquakeFilters {
  search?: string;
  minMagnitude?: number;
  maxMagnitude?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
  timeRange?: EarthquakeTimeRange;
  dataSource?: EarthquakeDataSource;
  criticalOnly?: boolean;
  nearLatitude?: number;
  nearLongitude?: number;
  radiusKm?: number;
}

export interface DashboardStats {
  totalEarthquakes: number;
  largestMagnitude: number;
  averageMagnitude: number;
  significantEvents: number;
  latestEarthquake: {
    id: string;
    magnitude: number | null;
    place: string;
    time: number;
  } | null;
  timeRangeCoverage?: TimeRangeCoverage;
}
