import { describe, expect, it } from 'vitest';
import {
  buildPhivolcsMonthlyArchiveUrl,
  listPhivolcsArchiveMonthsForFetch,
  parsePhivolcsSlugMonth,
} from '../phivolcsArchive.js';

describe('phivolcsArchive', () => {
  it('builds monthly archive URLs', () => {
    const url = buildPhivolcsMonthlyArchiveUrl('https://earthquake.phivolcs.dost.gov.ph', 2025, 1);
    expect(url).toBe('https://earthquake.phivolcs.dost.gov.ph/EQLatest-Monthly/2025/2025_January.html');
  });

  it('lists archive months excluding the current month', () => {
    const now = Date.UTC(2026, 5, 10, 12, 0, 0);
    const startTime = Date.UTC(2026, 4, 1, 0, 0, 0);
    const months = listPhivolcsArchiveMonthsForFetch(startTime, now);
    expect(months.some((entry) => entry.year === 2026 && entry.month === 5)).toBe(true);
    expect(months.some((entry) => entry.year === 2026 && entry.month === 6)).toBe(false);
  });

  it('parses bulletin slug month metadata', () => {
    expect(parsePhivolcsSlugMonth('2026_0609_1607_B2F')).toEqual({ year: 2026, month: 6 });
  });
});
