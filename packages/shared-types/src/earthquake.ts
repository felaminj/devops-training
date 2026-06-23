import type { EarthquakeDataSource } from './dataSource.js';

export interface EarthquakeProperties {
  mag: number | null;
  place: string | null;
  time: number;
  updated: number;
  tz: number | null;
  url: string | null;
  detail: string | null;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: string | null;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst: number | null;
  dmin: number | null;
  rms: number;
  gap: number | null;
  magType: string | null;
  type: string;
  title: string | null;
}

export interface EarthquakeGeometry {
  type: 'Point';
  coordinates: [number, number, number];
}

export interface EarthquakeFeature {
  type: 'Feature';
  properties: EarthquakeProperties;
  geometry: EarthquakeGeometry;
  id: string;
}

export interface Earthquake {
  id: string;
  magnitude: number | null;
  place: string;
  time: number;
  latitude: number;
  longitude: number;
  depth: number;
  url: string | null;
  tsunami: boolean;
  significance: number;
  status: string;
  magType: string | null;
  title: string;
  dataSource?: EarthquakeDataSource;
  felt?: number | null;
  cdi?: number | null;
  mmi?: number | null;
  epicentralMapUrl?: string | null;
  instrumentalIntensity?: string | null;
  expectingDamage?: boolean | null;
  expectingAftershocks?: boolean | null;
  origin?: string | null;
}

export interface UsgsGeoJsonFeed {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    count: number;
  };
  features: EarthquakeFeature[];
}
