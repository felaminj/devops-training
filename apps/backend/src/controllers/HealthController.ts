import type { Request, Response } from 'express';
import { createApiResponse } from '@earthquake/shared-utils';
import type { HealthService } from '../services/HealthService.js';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getHealth = (_req: Request, res: Response): void => {
    const status = this.healthService.getStatus();
    res.json(createApiResponse(status));
  };
}
