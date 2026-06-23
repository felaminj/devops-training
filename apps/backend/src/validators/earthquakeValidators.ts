import { z } from 'zod';

export const earthquakeFiltersSchema = z.object({
  search: z.string().optional(),
  minMagnitude: z.coerce.number().min(0).max(10).optional(),
  maxMagnitude: z.coerce.number().min(0).max(10).optional(),
  sortBy: z.enum(['time', 'magnitude']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  timeRange: z.enum(['24h', '7d', '30d', '1y', '5y', '10y', '100y']).optional(),
  dataSource: z.enum(['usgs', 'phivolcs']).optional(),
  criticalOnly: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((value) => value === true || value === 'true'),
  nearLatitude: z.coerce.number().min(-90).max(90).optional(),
  nearLongitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(20000).optional(),
});

export const magnitudeParamSchema = z.object({
  min: z.coerce.number().min(0).max(10),
});

export const earthquakeStatsQuerySchema = z.object({
  timeRange: z.enum(['24h', '7d', '30d', '1y', '5y', '10y', '100y']).optional(),
  dataSource: z.enum(['usgs', 'phivolcs']).optional(),
});

export const earthquakeIdParamSchema = z.object({
  id: z.string().min(1),
});
