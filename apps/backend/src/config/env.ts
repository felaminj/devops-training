import dotenv from 'dotenv';
import { z } from 'zod';
import type { AppConfig } from '../types/config.js';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3005),
  USGS_API_URL: z
    .string()
    .url()
    .default('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary'),
  USGS_QUERY_API_URL: z
    .string()
    .url()
    .default('https://earthquake.usgs.gov/fdsnws/event/1/query'),
  PHIVOLCS_API_URL: z
    .string()
    .url()
    .default('https://earthquake.phivolcs.dost.gov.ph'),
  CACHE_TTL: z.coerce.number().default(60),
  RATE_LIMIT_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env: AppConfig = {
  port: parsed.data.PORT,
  usgsApiUrl: parsed.data.USGS_API_URL,
  usgsQueryApiUrl: parsed.data.USGS_QUERY_API_URL,
  phivolcsApiUrl: parsed.data.PHIVOLCS_API_URL,
  cacheTtl: parsed.data.CACHE_TTL,
  rateLimitEnabled: parsed.data.RATE_LIMIT_ENABLED,
  rateLimitWindowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: parsed.data.RATE_LIMIT_MAX,
  nodeEnv: parsed.data.NODE_ENV,
  logLevel: parsed.data.LOG_LEVEL,
};
