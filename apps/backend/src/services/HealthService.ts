import type { AppConfig } from '../types/config.js';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  uptime: number;
  timestamp: string;
  environment: string;
}

export class HealthService {
  private readonly startedAt = Date.now();

  constructor(private readonly config: AppConfig) {}

  getStatus(): HealthStatus {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      environment: this.config.nodeEnv,
    };
  }
}
