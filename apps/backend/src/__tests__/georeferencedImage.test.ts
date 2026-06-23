import { describe, expect, it } from 'vitest';
import {
  boundsFromWorldFile,
  estimatePhivolcsOfficialMapBounds,
  parseWorldFile,
} from '../utils/georeferencedImage.js';

describe('georeferencedImage', () => {
  it('parses world file and computes bounds', () => {
    const worldFile = parseWorldFile('0.0083\n0.0\n0.0\n-0.0083\n122.5500\n9.1500\n');
    expect(worldFile).not.toBeNull();
    const bounds = boundsFromWorldFile(worldFile!, 768, 640);
    expect(bounds.southWest.longitude).toBeCloseTo(122.55, 2);
    expect(bounds.northEast.latitude).toBeCloseTo(9.15, 2);
    expect(bounds.northEast.longitude).toBeGreaterThan(bounds.southWest.longitude);
    expect(bounds.northEast.latitude).toBeGreaterThan(bounds.southWest.latitude);
  });

  it('estimates PHIVOLCS epicentral map bounds around epicenter', () => {
    const bounds = estimatePhivolcsOfficialMapBounds(13.26, 123.88, 2.9, 800, 600);
    expect(bounds.southWest.latitude).toBeLessThan(13.26);
    expect(bounds.northEast.latitude).toBeGreaterThan(13.26);
    expect(bounds.southWest.longitude).toBeLessThan(123.88);
    expect(bounds.northEast.longitude).toBeGreaterThan(123.88);
  });
});
