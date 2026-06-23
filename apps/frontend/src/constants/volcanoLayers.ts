import type { VolcanoClassification } from '@/types/geoLayers';

export const VOLCANO_LAYERS_INDEX_URL = '/data/volcanoes/index.json';

export const DEFAULT_VOLCANO_LAYER_ID = 'philippines';

export const VOLCANO_CLASSIFICATION_LABELS: Record<VolcanoClassification, string> = {
  active: 'Active',
  potentially_active: 'Potentially active',
  dormant: 'Dormant',
};

type VolcanoMarkerStyle = {
  radius: number;
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
};

export const VOLCANO_MARKER_STYLES: Record<VolcanoClassification, VolcanoMarkerStyle> = {
  active: {
    radius: 7,
    color: '#ffffff',
    fillColor: '#dc2626',
    fillOpacity: 0.95,
    weight: 2,
  },
  potentially_active: {
    radius: 6,
    color: '#ffffff',
    fillColor: '#f59e0b',
    fillOpacity: 0.95,
    weight: 2,
  },
  dormant: {
    radius: 5,
    color: '#ffffff',
    fillColor: '#64748b',
    fillOpacity: 0.9,
    weight: 1.5,
  },
};
