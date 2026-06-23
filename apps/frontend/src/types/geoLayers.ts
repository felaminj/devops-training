export type GeoLayerManifestEntry = {
  id: string;
  name: string;
  file: string;
  featureCount: number;
  defaultEnabled: boolean;
};

export type GeoLayerManifest = {
  source: string;
  attribution: string;
  layers: GeoLayerManifestEntry[];
};

export type VolcanoClassification = 'active' | 'potentially_active' | 'dormant';
