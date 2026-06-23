import axios, { type AxiosInstance } from 'axios';
import type { Earthquake, GeoBounds, IntensityMapPayload } from '@earthquake/shared-types';
import {
  getDataSourceLabel,
  intensityLevelToRoman,
  parseMacroseismicObservations,
} from '@earthquake/shared-utils';
import { logger } from '../config/logger.js';
import type { CacheStore } from '../types/cache.js';
import { NotFoundError } from '../types/errors.js';
import {
  boundsFromWorldFile,
  estimatePhivolcsOfficialMapBounds,
  parseWorldFile,
  readImageDimensions,
} from '../utils/georeferencedImage.js';
import type { EarthquakeService } from './EarthquakeService.js';

type CachedImage = {
  buffer: Buffer;
  contentType: string;
};

type UsgsEventDetail = {
  properties?: {
    products?: {
      shakemap?: Array<{
        contents?: Record<string, { url?: string }>;
      }>;
    };
  };
};

const USGS_OVERLAY_PNG = 'download/intensity_overlay.png';
const USGS_OVERLAY_WORLD = 'download/intensity_overlay.pngw';

export class IntensityMapService {
  private readonly client: AxiosInstance;
  private readonly imageCache = new Map<string, CachedImage>();

  constructor(
    private readonly earthquakeService: EarthquakeService,
    private readonly usgsQueryApiUrl: string,
    private readonly cache: CacheStore,
    private readonly cacheTtlMs: number
  ) {
    this.client = axios.create({
      timeout: 30000,
      responseType: 'arraybuffer',
      headers: { Accept: '*/*' },
    });
  }

  async getIntensityMap(eventId: string): Promise<IntensityMapPayload> {
    const earthquake = await this.earthquakeService.getById(eventId);
    const isPhivolcs = earthquake.dataSource === 'phivolcs' || eventId.startsWith('phivolcs:');
    if (isPhivolcs) {
      const official = await this.fetchPhivolcsOfficialMap(earthquake);
      if (official) return official;
    }
    if (!isPhivolcs) {
      const official = await this.fetchUsgsShakeMap(earthquake);
      if (official) return official;
    }
    throw new NotFoundError('No official intensity map is available for this earthquake.');
  }

  async getIntensityMapImage(eventId: string): Promise<CachedImage | null> {
    const cached = this.imageCache.get(eventId);
    if (cached) return cached;
    const payload = await this.getIntensityMap(eventId);
    if (!payload.imageUrl) return null;
    const image = await this.fetchRemoteImage(payload.imageUrl);
    if (!image) return null;
    this.imageCache.set(eventId, image);
    return image;
  }

  getProxiedImageUrl(eventId: string): string {
    return `/earthquakes/${encodeURIComponent(eventId)}/intensity-map/image`;
  }

  private async fetchPhivolcsOfficialMap(earthquake: Earthquake): Promise<IntensityMapPayload | null> {
    const mapUrl = earthquake.epicentralMapUrl;
    if (!mapUrl) return null;
    const image = await this.fetchRemoteImage(mapUrl);
    if (!image) return null;
    const dimensions = readImageDimensions(image.buffer);
    const bounds = dimensions
      ? estimatePhivolcsOfficialMapBounds(
          earthquake.latitude,
          earthquake.longitude,
          earthquake.magnitude,
          dimensions.width,
          dimensions.height
        )
      : estimatePhivolcsOfficialMapBounds(
          earthquake.latitude,
          earthquake.longitude,
          earthquake.magnitude,
          4,
          3
        );
    this.imageCache.set(earthquake.id, image);
    return this.buildOfficialPayload(earthquake, 'phivolcs-official', bounds);
  }

  private async fetchUsgsShakeMap(earthquake: Earthquake): Promise<IntensityMapPayload | null> {
    const usgsId = earthquake.id.startsWith('phivolcs:') ? null : earthquake.id;
    if (!usgsId) return null;
    const overlay = await this.resolveUsgsShakeMapOverlay(usgsId);
    if (!overlay) return null;
    const [pngBuffer, worldBuffer] = await Promise.all([
      this.fetchRemoteBuffer(overlay.pngUrl),
      this.fetchRemoteBuffer(overlay.worldUrl),
    ]);
    if (!pngBuffer || !worldBuffer) return null;
    const worldFile = parseWorldFile(worldBuffer.toString('utf8'));
    const dimensions = readImageDimensions(pngBuffer);
    if (!worldFile || !dimensions) return null;
    const bounds = boundsFromWorldFile(worldFile, dimensions.width, dimensions.height);
    const contentType = 'image/png';
    this.imageCache.set(earthquake.id, { buffer: pngBuffer, contentType });
    return this.buildOfficialPayload(earthquake, 'usgs-shakemap', bounds);
  }

  private async resolveUsgsShakeMapOverlay(
    eventId: string
  ): Promise<{ pngUrl: string; worldUrl: string } | null> {
    const cacheKey = `usgs-shakemap-meta:${eventId}`;
    const cached = this.cache.get<{ pngUrl: string; worldUrl: string }>(cacheKey);
    if (cached) return cached;
    try {
      const response = await axios.get<UsgsEventDetail | { features: UsgsEventDetail[] }>(
        this.usgsQueryApiUrl,
        { params: { format: 'geojson', eventid: eventId }, timeout: 30000 }
      );
      const detail = this.extractUsgsEventDetail(response.data);
      const shakemaps = detail?.properties?.products?.shakemap ?? [];
      const preferred = shakemaps[0];
      if (!preferred?.contents) return null;
      const pngContent = preferred.contents[USGS_OVERLAY_PNG];
      const worldContent = preferred.contents[USGS_OVERLAY_WORLD];
      if (!pngContent?.url || !worldContent?.url) return null;
      const resolved = { pngUrl: pngContent.url, worldUrl: worldContent.url };
      this.cache.set(cacheKey, resolved, this.cacheTtlMs);
      return resolved;
    } catch (error) {
      logger.warn({ err: error, eventId }, 'Failed to resolve USGS ShakeMap overlay');
      return null;
    }
  }

  private extractUsgsEventDetail(
    data: UsgsEventDetail | { features: UsgsEventDetail[] }
  ): UsgsEventDetail | null {
    if ('features' in data && Array.isArray(data.features)) {
      return data.features[0] ?? null;
    }
    if ('properties' in data) return data;
    return null;
  }

  private buildOfficialPayload(
    earthquake: Earthquake,
    source: 'phivolcs-official' | 'usgs-shakemap',
    bounds: GeoBounds
  ): IntensityMapPayload {
    const observations = parseMacroseismicObservations(earthquake.instrumentalIntensity);
    const peakLevel = observations.length > 0
      ? Math.max(...observations.map((item) => item.intensityLevel))
      : this.estimatePeakIntensityLevel(earthquake);
    const dataSource = earthquake.dataSource ?? 'usgs';
    const sourceLabel = getDataSourceLabel(dataSource);
    const note = source === 'phivolcs-official'
      ? 'Official PHIVOLCS epicentral intensity map from the earthquake bulletin.'
      : 'Official USGS ShakeMap intensity overlay with georeferenced bounds.';
    const attribution = source === 'phivolcs-official'
      ? 'PHIVOLCS-DOST'
      : 'U.S. Geological Survey ShakeMap';
    return {
      source,
      imageUrl: this.getProxiedImageUrl(earthquake.id),
      bounds,
      observations,
      peakIntensityRoman: intensityLevelToRoman(peakLevel),
      place: earthquake.place,
      time: earthquake.time,
      eventId: earthquake.id,
      magnitude: earthquake.magnitude,
      depthKm: earthquake.depth,
      dataSource,
      sourceLabel,
      note,
      attribution,
    };
  }

  private estimatePeakIntensityLevel(earthquake: Earthquake): number {
    if (earthquake.mmi !== null && earthquake.mmi !== undefined) {
      return Math.min(12, Math.max(1, Math.round(earthquake.mmi)));
    }
    if (earthquake.cdi !== null && earthquake.cdi !== undefined) {
      return Math.min(12, Math.max(1, Math.round(earthquake.cdi)));
    }
    if (earthquake.magnitude === null) return 3;
    return Math.min(12, Math.max(1, Math.round(3.3 + 1.4 * earthquake.magnitude)));
  }

  private async fetchRemoteImage(url: string): Promise<CachedImage | null> {
    const buffer = await this.fetchRemoteBuffer(url);
    if (!buffer) return null;
    const contentType = this.resolveContentType(url, buffer);
    return { buffer, contentType };
  }

  private async fetchRemoteBuffer(url: string): Promise<Buffer | null> {
    try {
      const response = await this.client.get<ArrayBuffer>(url);
      return Buffer.from(response.data);
    } catch (error) {
      logger.warn({ err: error, url }, 'Failed to fetch remote intensity map asset');
      return null;
    }
  }

  private resolveContentType(url: string, buffer: Buffer): string {
    if (url.endsWith('.png') || (buffer[0] === 0x89 && buffer[1] === 0x50)) return 'image/png';
    if (url.endsWith('.jpg') || url.endsWith('.jpeg') || (buffer[0] === 0xff && buffer[1] === 0xd8)) {
      return 'image/jpeg';
    }
    return 'application/octet-stream';
  }
}
