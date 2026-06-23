import { describe, expect, it } from 'vitest';
import {
  formatMagnitude,
  getMagnitudeColor,
  getMagnitudeHexColor,
  isSignificantMagnitude,
} from '../magnitude.js';

describe('magnitude utilities', () => {
  it('returns correct colors by magnitude range', () => {
    expect(getMagnitudeColor(2.5)).toBe('green');
    expect(getMagnitudeColor(3.5)).toBe('yellow');
    expect(getMagnitudeColor(5.5)).toBe('orange');
    expect(getMagnitudeColor(7.5)).toBe('red');
    expect(getMagnitudeColor(null)).toBe('gray');
  });

  it('returns hex colors', () => {
    expect(getMagnitudeHexColor(2)).toBe('#22c55e');
    expect(getMagnitudeHexColor(6)).toBe('#f97316');
  });

  it('formats magnitude values', () => {
    expect(formatMagnitude(4.256)).toBe('4.3');
    expect(formatMagnitude(null)).toBe('N/A');
  });

  it('detects significant magnitudes', () => {
    expect(isSignificantMagnitude(5)).toBe(true);
    expect(isSignificantMagnitude(4.9)).toBe(false);
    expect(isSignificantMagnitude(null)).toBe(false);
  });
});
