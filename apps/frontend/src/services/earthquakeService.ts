import type {
  ApiResponse,
  DashboardStats,
  Earthquake,
  EarthquakeDataSource,
  EarthquakeFilters,
  EarthquakeTimeRange,
  PaginatedData,
  TimeRangeCoverage,
} from '@earthquake/shared-types';
import { buildQueryString } from '@earthquake/shared-utils';
import apiClient from './apiClient';

const MAP_PAGE_SIZE = 100;

export async function fetchLatestEarthquakes(
  filters?: EarthquakeFilters
): Promise<PaginatedData<Earthquake>> {
  const query = buildQueryString({
    search: filters?.search,
    minMagnitude: filters?.minMagnitude,
    maxMagnitude: filters?.maxMagnitude,
    sortBy: filters?.sortBy,
    sortOrder: filters?.sortOrder,
    page: filters?.page,
    pageSize: filters?.pageSize,
    criticalOnly: filters?.criticalOnly ? 'true' : undefined,
    nearLatitude: filters?.nearLatitude,
    nearLongitude: filters?.nearLongitude,
    radiusKm: filters?.radiusKm,
    timeRange: filters?.timeRange,
    dataSource: filters?.dataSource,
  });
  const response = await apiClient.get<ApiResponse<PaginatedData<Earthquake>>>(
    `/earthquakes/latest${query}`
  );
  return response.data.data;
}

export type AllLatestEarthquakesResult = {
  items: Earthquake[];
  timeRangeCoverage?: TimeRangeCoverage;
};

export async function fetchAllLatestEarthquakes(
  filters?: Omit<EarthquakeFilters, 'page' | 'pageSize'>
): Promise<AllLatestEarthquakesResult> {
  const all: Earthquake[] = [];
  let timeRangeCoverage: TimeRangeCoverage | undefined;
  let page = 1;
  let hasNextPage = true;
  while (hasNextPage) {
    const data = await fetchLatestEarthquakes({
      ...filters,
      page,
      pageSize: MAP_PAGE_SIZE,
    });
    if (!timeRangeCoverage) timeRangeCoverage = data.timeRangeCoverage;
    all.push(...data.items);
    hasNextPage = data.pagination.hasNextPage;
    page += 1;
  }
  return { items: all, timeRangeCoverage };
}

export async function fetchSignificantEarthquakes(
  filters?: EarthquakeFilters
): Promise<PaginatedData<Earthquake>> {
  const query = buildQueryString({
    search: filters?.search,
    sortBy: filters?.sortBy,
    sortOrder: filters?.sortOrder,
    page: filters?.page,
    pageSize: filters?.pageSize,
  });
  const response = await apiClient.get<ApiResponse<PaginatedData<Earthquake>>>(
    `/earthquakes/significant${query}`
  );
  return response.data.data;
}

export async function fetchEarthquakeById(id: string): Promise<Earthquake> {
  const encodedId = encodeURIComponent(id);
  const response = await apiClient.get<ApiResponse<Earthquake>>(`/earthquakes/${encodedId}`);
  return response.data.data;
}

export async function fetchDashboardStats(
  timeRange?: EarthquakeTimeRange,
  dataSource?: EarthquakeDataSource
): Promise<DashboardStats> {
  const query = buildQueryString({ timeRange, dataSource });
  const response = await apiClient.get<ApiResponse<DashboardStats>>(`/earthquakes/stats${query}`);
  return response.data.data;
}
