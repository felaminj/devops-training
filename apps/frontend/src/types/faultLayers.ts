export type FaultLayerManifestEntry = {
  id: string;
  name: string;
  file: string;
  featureCount: number;
  defaultEnabled: boolean;
};

export type FaultLayerManifest = {
  source: string;
  attribution: string;
  layers: FaultLayerManifestEntry[];
};
