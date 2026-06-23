import type { EarthquakeDataSource } from './dataSource.js';
import type { GeoBounds } from './geo.js';

export type IntensityMapSourceType = 'phivolcs-official' | 'usgs-shakemap' | 'modeled';

export type MacroseismicObservation = {
  place: string;
  intensityRoman: string;
  intensityLevel: number;
};

export interface IntensityMapPayload {
  source: IntensityMapSourceType;
  imageUrl: string | null;
  bounds: GeoBounds | null;
  observations: MacroseismicObservation[];
  peakIntensityRoman: string;
  place: string;
  time: number;
  eventId: string;
  magnitude: number | null;
  depthKm: number;
  dataSource: EarthquakeDataSource;
  sourceLabel: string;
  note: string;
  attribution: string;
}
