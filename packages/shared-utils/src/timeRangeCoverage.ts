import type {
  Earthquake,
  EarthquakeDataSource,
  EarthquakeTimeRange,
  TimeRangeCoverage,
} from '@earthquake/shared-types';
import { formatTimestamp } from './date.js';
import { getDataSourceLabel } from './dataSource.js';
import { getTimeRangeLabel, resolveTimeRangeStart } from './timeRange.js';

type ResolveTimeRangeInput = {
  earthquakes: Earthquake[];
  timeRange: EarthquakeTimeRange;
  dataSource: EarthquakeDataSource;
  isTruncated?: boolean;
  truncationLimit?: number;
};

type ResolveTimeRangeOutput = {
  earthquakes: Earthquake[];
  coverage: TimeRangeCoverage;
};

function getEventTimeBounds(earthquakes: Earthquake[]): {
  oldestEventTime: number | null;
  newestEventTime: number | null;
} {
  const firstEvent = earthquakes[0];
  if (!firstEvent) {
    return { oldestEventTime: null, newestEventTime: null };
  }
  let oldestEventTime = firstEvent.time;
  let newestEventTime = firstEvent.time;
  earthquakes.forEach((earthquake) => {
    if (earthquake.time < oldestEventTime) oldestEventTime = earthquake.time;
    if (earthquake.time > newestEventTime) newestEventTime = earthquake.time;
  });
  return { oldestEventTime, newestEventTime };
}

function buildCoverageMessage(
  timeRange: EarthquakeTimeRange,
  dataSource: EarthquakeDataSource,
  oldestEventTime: number | null,
  totalAvailableEvents: number,
  usedFallback: boolean,
  isTruncated: boolean,
  truncationLimit?: number
): string | null {
  const sourceLabel = getDataSourceLabel(dataSource);
  const rangeLabel = getTimeRangeLabel(timeRange).toLowerCase();
  if (isTruncated && truncationLimit) {
    return `${sourceLabel} returned more than ${truncationLimit.toLocaleString()} events for ${rangeLabel}. Showing the first ${truncationLimit.toLocaleString()} results.`;
  }
  if (usedFallback) {
    return `No events were found in ${rangeLabel} from ${sourceLabel}. Showing all ${totalAvailableEvents.toLocaleString()} available events instead.`;
  }
  if (dataSource === 'phivolcs' && oldestEventTime !== null && timeRange === '100y') {
    return `PHIVOLCS monthly archives are available from 2018 onward. Showing ${totalAvailableEvents.toLocaleString()} events back to ${formatTimestamp(oldestEventTime)}.`;
  }
  if (oldestEventTime !== null && oldestEventTime > resolveTimeRangeStart(timeRange).getTime()) {
    return `${sourceLabel} does not provide a full ${rangeLabel} history. Showing ${totalAvailableEvents.toLocaleString()} events back to ${formatTimestamp(oldestEventTime)}.`;
  }
  return null;
}

export function filterEarthquakesByTimeRange(
  earthquakes: Earthquake[],
  timeRange: EarthquakeTimeRange
): Earthquake[] {
  const requestedStartTime = resolveTimeRangeStart(timeRange).getTime();
  return earthquakes.filter((earthquake) => earthquake.time >= requestedStartTime);
}

export function resolveTimeRangeEarthquakes(input: ResolveTimeRangeInput): ResolveTimeRangeOutput {
  const requestedStartTime = resolveTimeRangeStart(input.timeRange).getTime();
  const allBounds = getEventTimeBounds(input.earthquakes);
  const filtered = filterEarthquakesByTimeRange(input.earthquakes, input.timeRange);
  const usedFallback = filtered.length === 0 && input.earthquakes.length > 0;
  const earthquakes = usedFallback ? input.earthquakes : filtered;
  const bounds = getEventTimeBounds(earthquakes);
  const isTruncated = input.isTruncated === true;
  const archiveOldestTime = allBounds.oldestEventTime;
  const archiveDoesNotReachRequestedStart =
    archiveOldestTime !== null && archiveOldestTime > requestedStartTime;
  const isExtendedRange =
    input.timeRange === '30d' ||
    input.timeRange === '1y' ||
    input.timeRange === '5y' ||
    input.timeRange === '10y' ||
    input.timeRange === '100y';
  const isPartialCoverage =
    usedFallback ||
    isTruncated ||
    (archiveDoesNotReachRequestedStart && (isExtendedRange || filtered.length === 0));
  const message = isPartialCoverage
    ? buildCoverageMessage(
        input.timeRange,
        input.dataSource,
        archiveOldestTime,
        earthquakes.length,
        usedFallback,
        isTruncated,
        input.truncationLimit
      )
    : null;
  return {
    earthquakes,
    coverage: {
      requestedTimeRange: input.timeRange,
      requestedStartTime,
      oldestEventTime: bounds.oldestEventTime,
      newestEventTime: bounds.newestEventTime,
      totalAvailableEvents: earthquakes.length,
      isPartialCoverage,
      isTruncated,
      message,
    },
  };
}
