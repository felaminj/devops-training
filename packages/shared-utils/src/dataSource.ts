import type { EarthquakeDataSource } from '@earthquake/shared-types';

export const EARTHQUAKE_DATA_SOURCE_OPTIONS: Array<{
  value: EarthquakeDataSource;
  label: string;
  description: string;
}> = [
  {
    value: 'usgs',
    label: 'USGS',
    description: 'Global earthquake feed from the US Geological Survey',
  },
  {
    value: 'phivolcs',
    label: 'PHIVOLCS',
    description: 'Philippine seismic events from DOST-PHIVOLCS',
  },
];

const DATA_SOURCE_LABELS = new Map(
  EARTHQUAKE_DATA_SOURCE_OPTIONS.map((option) => [option.value, option.label])
);

export function getDataSourceLabel(source: EarthquakeDataSource): string {
  return DATA_SOURCE_LABELS.get(source) ?? 'USGS';
}

export function isPhivolcsSource(source: EarthquakeDataSource): boolean {
  return source === 'phivolcs';
}
