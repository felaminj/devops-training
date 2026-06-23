import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { MemoryCacheRepository } from './repositories/MemoryCacheRepository.js';
import { PhivolcsEarthquakeRepository } from './repositories/PhivolcsEarthquakeRepository.js';
import { UsgsEarthquakeRepository } from './repositories/UsgsEarthquakeRepository.js';
import { EarthquakeService } from './services/EarthquakeService.js';
import { IntensityMapService } from './services/IntensityMapService.js';
import { HealthService } from './services/HealthService.js';
import { HealthController } from './controllers/HealthController.js';
import { EarthquakeController } from './controllers/EarthquakeController.js';
import { createHealthRoutes } from './routes/healthRoutes.js';
import { createEarthquakeRoutes } from './routes/earthquakeRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

export function createAppContext() {
  const app = express();
  const cache = new MemoryCacheRepository();
  const usgsRepository = new UsgsEarthquakeRepository(
    env.usgsApiUrl,
    env.usgsQueryApiUrl,
    cache,
    env.cacheTtl * 1000
  );
  const phivolcsRepository = new PhivolcsEarthquakeRepository(
    env.phivolcsApiUrl,
    cache,
    env.cacheTtl * 1000
  );
  const earthquakeService = new EarthquakeService(usgsRepository, phivolcsRepository);
  const intensityMapService = new IntensityMapService(
    earthquakeService,
    env.usgsQueryApiUrl,
    cache,
    env.cacheTtl * 1000
  );
  const healthService = new HealthService(env);
  const healthController = new HealthController(healthService);
  const earthquakeController = new EarthquakeController(earthquakeService, intensityMapService);

  app.use(
    pinoHttp({
      logger,
      autoLogging: true,
    })
  );
  app.use(cors());
  app.use(express.json());
  if (env.rateLimitEnabled) {
    app.use(
      rateLimit({
        windowMs: env.rateLimitWindowMs,
        max: env.rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          error: {
            message: 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          timestamp: new Date().toISOString(),
        },
      })
    );
  }

  app.use('/api/health', createHealthRoutes(healthController));
  app.use('/api/earthquakes', createEarthquakeRoutes(earthquakeController));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, earthquakeService };
}

export function createApp() {
  return createAppContext().app;
}
