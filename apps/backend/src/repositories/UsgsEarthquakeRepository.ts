import axios, { type AxiosInstance } from 'axios';
import type {
  Earthquake,
  EarthquakeFeature,
  EarthquakeTimeRange,
  RepositoryTimeRangeResult,
  UsgsGeoJsonFeed,
} from '@earthquake/shared-types';
import {
  extractUsgsEarthquakeFeatures,
  mapFeaturesToEarthquakes,
  resolveTimeRangeStart,
} from '@earthquake/shared-utils';
import type { CacheStore } from '../types/cache.js';
import { ExternalServiceError } from '../types/errors.js';
import { logger } from '../config/logger.js';

type FeedType = 'all_day' | 'all_week' | 'all_month' | 'significant_month';

const FEED_TIME_RANGES: Partial<Record<EarthquakeTimeRange, FeedType>> = {
  '24h': 'all_day',
  '7d': 'all_week',
  '30d': 'all_month',
};

const QUERY_PAGE_SIZE = 20000;
const QUERY_MAX_EVENTS = 50000;

export class UsgsEarthquakeRepository {
  private readonly client: AxiosInstance;

  constructor(
    private readonly usgsApiUrl: string,
    private readonly usgsQueryApiUrl: string,
    private readonly cache: CacheStore,
    private readonly cacheTtlMs: number
  ) {
    this.client = axios.create({
      timeout: 30000,
      headers: { Accept: 'application/json' },
    });
  }

  async getLatest(): Promise<RepositoryTimeRangeResult> {
    return this.getByTimeRange('24h');
  }

  async getByTimeRange(timeRange: EarthquakeTimeRange): Promise<RepositoryTimeRangeResult> {
    const feedType = FEED_TIME_RANGES[timeRange];
    if (feedType) {
      const earthquakes = await this.fetchFeed(feedType, `range:${timeRange}`, timeRange);
      return { earthquakes, isTruncated: false };
    }
    return this.fetchQueryRange(timeRange);
  }

  async getSignificant(): Promise<Earthquake[]> {
    return this.fetchFeed('significant_month', 'significant', '30d');
  }

  async getByMinimumMagnitude(minMagnitude: number): Promise<Earthquake[]> {
    const { earthquakes } = await this.getLatest();
    return earthquakes.filter((eq) => (eq.magnitude ?? 0) >= minMagnitude);
  }

  async getById(id: string): Promise<Earthquake | null> {
    const cacheKey = `earthquake:${id}`;
    try {
      const response = await this.client.get<UsgsGeoJsonFeed | EarthquakeFeature>(
        this.usgsQueryApiUrl,
        { params: { format: 'geojson', eventid: id } }
      );
      const earthquakes = mapFeaturesToEarthquakes(extractUsgsEarthquakeFeatures(response.data));
      const found = earthquakes.find((earthquake) => earthquake.id === id) ?? earthquakes[0] ?? null;
      if (found) {
        this.cache.set(cacheKey, found, this.cacheTtlMs);
        return found;
      }
    } catch (error) {
      logger.warn({ err: error, id }, 'USGS event lookup failed, falling back to cache');
    }
    return this.cache.get<Earthquake>(cacheKey) ?? null;
  }

  private cacheEarthquakes(earthquakes: Earthquake[], cacheTtlMs: number): void {
    earthquakes.forEach((earthquake) => {
      this.cache.set(`earthquake:${earthquake.id}`, earthquake, cacheTtlMs);
    });
  }

  private getCacheTtlForRange(timeRange: EarthquakeTimeRange): number {
    if (timeRange === '1y') return this.cacheTtlMs * 5;
    if (timeRange === '5y' || timeRange === '10y' || timeRange === '100y') {
      return this.cacheTtlMs * 60;
    }
    return this.cacheTtlMs;
  }

  private async fetchFeed(
    feedType: FeedType,
    cacheKey: string,
    timeRange: EarthquakeTimeRange
  ): Promise<Earthquake[]> {
    const cached = this.cache.get<Earthquake[]>(cacheKey);
    if (cached) return cached;

    const url = `${this.usgsApiUrl}/${feedType}.geojson`;
    try {
      const response = await this.client.get<UsgsGeoJsonFeed>(url);
      const earthquakes = mapFeaturesToEarthquakes(response.data.features);
      this.cacheEarthquakes(earthquakes, this.getCacheTtlForRange(timeRange));
      this.cache.set(cacheKey, earthquakes, this.getCacheTtlForRange(timeRange));
      return earthquakes;
    } catch (error) {
      logger.error({ err: error, url }, 'Failed to fetch USGS earthquake feed');
      throw new ExternalServiceError('Failed to fetch earthquake data from USGS');
    }
  }

  private async fetchQueryRange(timeRange: EarthquakeTimeRange): Promise<RepositoryTimeRangeResult> {
    const cacheKey = `range:${timeRange}`;
    const cached = this.cache.get<RepositoryTimeRangeResult>(cacheKey);
    if (cached) return cached;

    const starttime = resolveTimeRangeStart(timeRange).toISOString();
    const endtime = new Date().toISOString();
    const earthquakes: Earthquake[] = [];
    let offset = 0;

    try {
      while (earthquakes.length < QUERY_MAX_EVENTS) {
        const response = await this.client.get<UsgsGeoJsonFeed>(this.usgsQueryApiUrl, {
          params: {
            format: 'geojson',
            starttime,
            endtime,
            limit: QUERY_PAGE_SIZE,
            offset,
            orderby: 'time',
          },
        });
        const batch = mapFeaturesToEarthquakes(response.data.features);
        this.cacheEarthquakes(batch, this.getCacheTtlForRange(timeRange));
        earthquakes.push(...batch);
        if (batch.length < QUERY_PAGE_SIZE) break;
        offset += QUERY_PAGE_SIZE;
      }

      const trimmed = earthquakes.slice(0, QUERY_MAX_EVENTS);
      const result: RepositoryTimeRangeResult = {
        earthquakes: trimmed,
        isTruncated: trimmed.length >= QUERY_MAX_EVENTS,
        truncationLimit: QUERY_MAX_EVENTS,
      };
      this.cache.set(cacheKey, result, this.getCacheTtlForRange(timeRange));
      return result;
    } catch (error) {
      logger.error({ err: error, timeRange }, 'Failed to fetch USGS earthquake query range');
      throw new ExternalServiceError('Failed to fetch earthquake data from USGS');
    }
  }
}
