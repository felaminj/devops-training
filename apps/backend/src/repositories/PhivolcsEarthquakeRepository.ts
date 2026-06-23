import https from 'node:https';
import axios, { type AxiosInstance } from 'axios';
import type { Earthquake, EarthquakeTimeRange, RepositoryTimeRangeResult } from '@earthquake/shared-types';
import {
  buildPhivolcsMonthlyArchiveUrl,
  listPhivolcsArchiveMonthsForFetch,
  parsePhivolcsSlugMonth,
  resolveTimeRangeStart,
} from '@earthquake/shared-utils';
import type { CacheStore } from '../types/cache.js';
import { ExternalServiceError } from '../types/errors.js';
import { logger } from '../config/logger.js';
import {
  bulletinUrlFromSlug,
  mapPhivolcsBulletinToEarthquake,
  mapPhivolcsRowToEarthquake,
  parsePhivolcsBulletin,
  parsePhivolcsIndexRows,
  slugFromPhivolcsEarthquakeId,
  type PhivolcsIndexRow,
} from '../parsers/phivolcsParser.js';

const ARCHIVE_FETCH_CONCURRENCY = 6;

export class PhivolcsEarthquakeRepository {
  private readonly client: AxiosInstance;

  constructor(
    private readonly baseUrl: string,
    private readonly cache: CacheStore,
    private readonly cacheTtlMs: number
  ) {
    this.client = axios.create({
      timeout: 30000,
      headers: { Accept: 'text/html' },
      responseType: 'text',
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
  }

  async getLatest(): Promise<RepositoryTimeRangeResult> {
    return this.getByTimeRange('24h');
  }

  async getByTimeRange(timeRange: EarthquakeTimeRange): Promise<RepositoryTimeRangeResult> {
    const startTime = resolveTimeRangeStart(timeRange).getTime();
    const earthquakes = await this.fetchEarthquakesFromStartTime(startTime);
    return { earthquakes, isTruncated: false };
  }

  async getById(id: string): Promise<Earthquake | null> {
    const cacheKey = `phivolcs:earthquake:${id}`;
    const slug = slugFromPhivolcsEarthquakeId(id);
    const bulletinUrl = bulletinUrlFromSlug(this.baseUrl, slug);
    try {
      const html = await this.fetchHtml(bulletinUrl);
      const bulletin = parsePhivolcsBulletin(html, bulletinUrl);
      const matchingRow = await this.findRowBySlug(slug);
      const earthquake = matchingRow
        ? mapPhivolcsRowToEarthquake(matchingRow, this.baseUrl, bulletin)
        : mapPhivolcsBulletinToEarthquake(slug, bulletin, this.baseUrl);
      if (earthquake) {
        this.cache.set(cacheKey, earthquake, this.cacheTtlMs);
        return earthquake;
      }
    } catch {
      // Fall back to a cached list entry when bulletin enrichment is unavailable.
    }
    return this.cache.get<Earthquake>(cacheKey) ?? null;
  }

  private async fetchEarthquakesFromStartTime(startTime: number): Promise<Earthquake[]> {
    const cacheKey = `phivolcs:earthquakes:${startTime}`;
    const cached = this.cache.get<Earthquake[]>(cacheKey);
    if (cached) return cached;

    const indexRows = await this.fetchIndexRows();
    const archiveMonths = listPhivolcsArchiveMonthsForFetch(startTime);
    const archiveRows = await this.fetchArchiveRows(archiveMonths);
    const mergedRows = this.mergeRows(indexRows, archiveRows);
    const earthquakes = mergedRows
      .map((row) => {
        const earthquake = mapPhivolcsRowToEarthquake(row, this.baseUrl);
        if (earthquake) {
          this.cache.set(`phivolcs:earthquake:${earthquake.id}`, earthquake, this.cacheTtlMs);
        }
        return earthquake;
      })
      .filter((earthquake): earthquake is Earthquake => earthquake !== null);

    const cacheTtl = archiveMonths.length > 0 ? this.cacheTtlMs * 10 : this.cacheTtlMs;
    this.cache.set(cacheKey, earthquakes, cacheTtl);
    return earthquakes;
  }

  private async findRowBySlug(slug: string): Promise<PhivolcsIndexRow | null> {
    const indexRows = await this.fetchIndexRows();
    const normalizedSlug = slug.toUpperCase();
    const indexMatch = indexRows.find(
      (row) => row.bulletinSlug?.toUpperCase() === normalizedSlug
    );
    if (indexMatch) return indexMatch;

    const month = parsePhivolcsSlugMonth(slug);
    if (!month) return null;
    const archiveRows = await this.fetchArchiveRowsForMonth(month.year, month.month);
    return archiveRows.find((row) => row.bulletinSlug?.toUpperCase() === normalizedSlug) ?? null;
  }

  private mergeRows(primaryRows: PhivolcsIndexRow[], archiveRows: PhivolcsIndexRow[]): PhivolcsIndexRow[] {
    const merged = new Map<string, PhivolcsIndexRow>();
    [...archiveRows, ...primaryRows].forEach((row) => {
      const key = row.bulletinSlug ?? `${row.dateTimeText}:${row.latitude}:${row.longitude}`;
      merged.set(key, row);
    });
    return [...merged.values()];
  }

  private async fetchArchiveRows(
    months: ReturnType<typeof listPhivolcsArchiveMonthsForFetch>
  ): Promise<PhivolcsIndexRow[]> {
    if (months.length === 0) return [];
    const batches: PhivolcsIndexRow[] = [];
    for (let index = 0; index < months.length; index += ARCHIVE_FETCH_CONCURRENCY) {
      const chunk = months.slice(index, index + ARCHIVE_FETCH_CONCURRENCY);
      const chunkRows = await Promise.all(
        chunk.map((entry) => this.fetchArchiveRowsForMonth(entry.year, entry.month))
      );
      batches.push(...chunkRows.flat());
    }
    return batches;
  }

  private async fetchArchiveRowsForMonth(year: number, month: number): Promise<PhivolcsIndexRow[]> {
    const cacheKey = `phivolcs:archive-rows:${year}:${month}`;
    const cached = this.cache.get<PhivolcsIndexRow[]>(cacheKey);
    if (cached) return cached;

    const archiveUrl = buildPhivolcsMonthlyArchiveUrl(this.baseUrl, year, month);
    try {
      const html = await this.fetchHtml(archiveUrl);
      const rows = parsePhivolcsIndexRows(html);
      this.cache.set(cacheKey, rows, this.cacheTtlMs * 30);
      return rows;
    } catch (error) {
      logger.warn({ err: error, archiveUrl }, 'PHIVOLCS monthly archive unavailable');
      return [];
    }
  }

  private async fetchIndexRows(): Promise<PhivolcsIndexRow[]> {
    const cacheKey = 'phivolcs:index-rows';
    const cached = this.cache.get<PhivolcsIndexRow[]>(cacheKey);
    if (cached) return cached;

    const html = await this.fetchHtml(`${this.baseUrl}/`);
    const rows = parsePhivolcsIndexRows(html);
    this.cache.set(cacheKey, rows, this.cacheTtlMs);
    return rows;
  }

  private async fetchHtml(url: string): Promise<string> {
    try {
      const response = await this.client.get<string>(url);
      return response.data;
    } catch (error) {
      logger.error({ err: error, url }, 'Failed to fetch PHIVOLCS HTML');
      throw new ExternalServiceError('Failed to fetch earthquake data from PHIVOLCS');
    }
  }
}
