export interface AppConfig {
  port: number;
  usgsApiUrl: string;
  usgsQueryApiUrl: string;
  phivolcsApiUrl: string;
  cacheTtl: number;
  rateLimitEnabled: boolean;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  nodeEnv: string;
  logLevel: string;
}
