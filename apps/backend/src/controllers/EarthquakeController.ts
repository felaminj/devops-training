import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@earthquake/shared-utils';
import type {
  EarthquakeDataSource,
  EarthquakeFilters,
  EarthquakeTimeRange,
} from '@earthquake/shared-types';
import type { EarthquakeService } from '../services/EarthquakeService.js';
import type { IntensityMapService } from '../services/IntensityMapService.js';

export class EarthquakeController {
  constructor(
    private readonly earthquakeService: EarthquakeService,
    private readonly intensityMapService: IntensityMapService
  ) {}

  getLatest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as EarthquakeFilters;
      const data = await this.earthquakeService.getLatest(filters);
      res.json(createApiResponse(data));
    } catch (error) {
      next(error);
    }
  };

  getSignificant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as EarthquakeFilters;
      const data = await this.earthquakeService.getSignificant(filters);
      res.json(createApiResponse(data));
    } catch (error) {
      next(error);
    }
  };

  getByMagnitude = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const minMagnitude = Number(req.params.min);
      const filters = req.query as EarthquakeFilters;
      const data = await this.earthquakeService.getByMinimumMagnitude(minMagnitude, filters);
      res.json(createApiResponse(data));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const data = await this.earthquakeService.getById(id);
      res.json(createApiResponse(data));
    } catch (error) {
      next(error);
    }
  };

  getIntensityMap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const data = await this.intensityMapService.getIntensityMap(id);
      res.json(createApiResponse(data));
    } catch (error) {
      next(error);
    }
  };

  getIntensityMapImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const image = await this.intensityMapService.getIntensityMapImage(id);
      if (!image) {
        res.status(404).json({
          success: false,
          error: { message: 'Intensity map image not available', code: 'NOT_FOUND' },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      res.setHeader('Content-Type', image.contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(image.buffer);
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const timeRange = (req.query.timeRange as EarthquakeTimeRange | undefined) ?? '24h';
      const dataSource = (req.query.dataSource as EarthquakeDataSource | undefined) ?? 'usgs';
      const data = await this.earthquakeService.getDashboardStats(timeRange, dataSource);
      res.json(createApiResponse(data));
    } catch (error) {
      next(error);
    }
  };
}
