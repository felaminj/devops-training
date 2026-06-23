import { describe, expect, it } from 'vitest';
import {
  extractUsgsEarthquakeFeatures,
  mapFeaturesToEarthquakes,
} from '../earthquake.js';

const sampleFeature = {
  type: 'Feature' as const,
  id: 'us7000srk7',
  geometry: { type: 'Point' as const, coordinates: [125.5, 5.2, 69.5] as [number, number, number] },
  properties: {
    mag: 5.1,
    place: '52 km S of Sarangani, Philippines',
    time: 1_749_414_542_000,
    updated: 1_749_414_542_000,
    tz: null,
    url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000srk7',
    detail: null,
    felt: null,
    cdi: null,
    mmi: null,
    alert: null,
    status: 'reviewed',
    tsunami: 0,
    sig: 400,
    net: 'us',
    code: '7000srk7',
    ids: ',us7000srk7,',
    sources: ',us,',
    types: ',origin,',
    nst: null,
    dmin: null,
    rms: 0.5,
    gap: null,
    magType: 'mww',
    type: 'earthquake',
    title: 'M 5.1 - 52 km S of Sarangani, Philippines',
  },
};

describe('extractUsgsEarthquakeFeatures', () => {
  it('extracts a single USGS Feature response', () => {
    const features = extractUsgsEarthquakeFeatures(sampleFeature);
    expect(features).toHaveLength(1);
    expect(features[0]?.id).toBe('us7000srk7');
  });

  it('extracts features from a FeatureCollection response', () => {
    const features = extractUsgsEarthquakeFeatures({
      type: 'FeatureCollection',
      metadata: {
        generated: 1,
        url: 'https://example.com',
        title: 'test',
        status: 200,
        count: 1,
      },
      features: [sampleFeature],
    });
    expect(features).toHaveLength(1);
    expect(mapFeaturesToEarthquakes(features)[0]?.magnitude).toBe(5.1);
  });
});
