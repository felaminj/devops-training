import type { Earthquake, EarthquakeFeature, UsgsGeoJsonFeed } from '@earthquake/shared-types';

export function mapFeatureToEarthquake(feature: EarthquakeFeature): Earthquake {
  const [longitude, latitude, depth] = feature.geometry.coordinates;
  return {
    id: feature.id,
    magnitude: feature.properties.mag,
    place: feature.properties.place ?? 'Unknown location',
    time: feature.properties.time,
    latitude,
    longitude,
    depth,
    url: feature.properties.url,
    tsunami: feature.properties.tsunami === 1,
    significance: feature.properties.sig,
    status: feature.properties.status,
    magType: feature.properties.magType,
    title: feature.properties.title ?? feature.properties.place ?? 'Earthquake',
    dataSource: 'usgs',
    felt: feature.properties.felt,
    cdi: feature.properties.cdi,
    mmi: feature.properties.mmi,
  };
}

export function mapFeaturesToEarthquakes(features: EarthquakeFeature[]): Earthquake[] {
  return features.map(mapFeatureToEarthquake);
}

export function extractUsgsEarthquakeFeatures(
  data: UsgsGeoJsonFeed | EarthquakeFeature
): EarthquakeFeature[] {
  if ('features' in data && Array.isArray(data.features)) {
    return data.features;
  }
  if (data.type === 'Feature' && 'geometry' in data) {
    return [data];
  }
  return [];
}
