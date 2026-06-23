import type { EarthquakeTimeRange } from '@earthquake/shared-types';

export type TimeRangeOption = {
  value: EarthquakeTimeRange;
  label: string;
};

export const EARTHQUAKE_TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '1y', label: 'Last year' },
  { value: '5y', label: 'Last 5 years' },
  { value: '10y', label: 'Last 10 years' },
  { value: '100y', label: 'Last 100 years' },
];

const TIME_RANGE_LABELS = new Map(
  EARTHQUAKE_TIME_RANGE_OPTIONS.map((option) => [option.value, option.label])
);

export function getTimeRangeLabel(range: EarthquakeTimeRange): string {
  return TIME_RANGE_LABELS.get(range) ?? 'Last 24 hours';
}

export function isLiveTimeRange(range: EarthquakeTimeRange): boolean {
  return range === '24h';
}

export function resolveTimeRangeStart(range: EarthquakeTimeRange, now = new Date()): Date {
  const start = new Date(now);
  if (range === '24h') {
    start.setUTCHours(start.getUTCHours() - 24);
    return start;
  }
  if (range === '7d') {
    start.setUTCDate(start.getUTCDate() - 7);
    return start;
  }
  if (range === '30d') {
    start.setUTCDate(start.getUTCDate() - 30);
    return start;
  }
  if (range === '1y') {
    start.setUTCFullYear(start.getUTCFullYear() - 1);
    return start;
  }
  if (range === '5y') {
    start.setUTCFullYear(start.getUTCFullYear() - 5);
    return start;
  }
  if (range === '10y') {
    start.setUTCFullYear(start.getUTCFullYear() - 10);
    return start;
  }
  start.setUTCFullYear(start.getUTCFullYear() - 100);
  return start;
}
