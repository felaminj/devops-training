import { Router } from 'express';
import type { EarthquakeController } from '../controllers/EarthquakeController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  earthquakeFiltersSchema,
  earthquakeIdParamSchema,
  earthquakeStatsQuerySchema,
  magnitudeParamSchema,
} from '../validators/earthquakeValidators.js';

export function createEarthquakeRoutes(controller: EarthquakeController): Router {
  const router = Router();

  router.get('/stats', validateRequest(earthquakeStatsQuerySchema, 'query'), controller.getStats);
  router.get('/latest', validateRequest(earthquakeFiltersSchema, 'query'), controller.getLatest);
  router.get(
    '/significant',
    validateRequest(earthquakeFiltersSchema, 'query'),
    controller.getSignificant
  );
  router.get(
    '/magnitude/:min',
    validateRequest(magnitudeParamSchema, 'params'),
    validateRequest(earthquakeFiltersSchema, 'query'),
    controller.getByMagnitude
  );
  router.get(
    '/:id/intensity-map/image',
    validateRequest(earthquakeIdParamSchema, 'params'),
    controller.getIntensityMapImage
  );
  router.get(
    '/:id/intensity-map',
    validateRequest(earthquakeIdParamSchema, 'params'),
    controller.getIntensityMap
  );
  router.get(
    '/:id',
    validateRequest(earthquakeIdParamSchema, 'params'),
    controller.getById
  );

  return router;
}
