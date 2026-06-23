import type { DashboardStats } from './filters.js';

export type EarthquakeStreamEventType = 'connected' | 'earthquake_update';

export interface EarthquakeStreamMessage {
  type: EarthquakeStreamEventType;
  data?: {
    stats: DashboardStats;
  };
  timestamp: string;
}
