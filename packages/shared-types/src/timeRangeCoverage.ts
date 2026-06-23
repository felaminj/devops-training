import type { EarthquakeDataSource } from './dataSource.js';
import type { Earthquake } from './earthquake.js';
import type { EarthquakeTimeRange } from './timeRange.js';

export interface TimeRangeCoverage {
  requestedTimeRange: EarthquakeTimeRange;
  requestedStartTime: number;
  oldestEventTime: number | null;
  newestEventTime: number | null;
  totalAvailableEvents: number;
  isPartialCoverage: boolean;
  isTruncated: boolean;
  message: string | null;
}

export interface RepositoryTimeRangeResult {
  earthquakes: Earthquake[];
  isTruncated: boolean;
  truncationLimit?: number;
}

export interface ResolveTimeRangeOptions {
  isTruncated?: boolean;
  truncationLimit?: number;
  dataSource: EarthquakeDataSource;
}
