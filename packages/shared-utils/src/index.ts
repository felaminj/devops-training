export {
  formatTimestamp,
  formatRelativeTime,
  toIsoTimestamp,
} from './date.js';

export {
  getMagnitudeColor,
  getMagnitudeHexColor,
  formatMagnitude,
  isSignificantMagnitude,
  type MagnitudeColor,
} from './magnitude.js';

export {
  formatCoordinates,
  formatDepth,
  isValidCoordinate,
} from './coordinates.js';

export {
  haversineDistanceKm,
  isWithinRadiusKm,
  isGloballySpreadEvents,
  PHILIPPINES_BOUNDS,
  PHILIPPINES_MAP_CENTER,
  PHILIPPINES_DEFAULT_ZOOM,
  type GeoBounds,
  type GeoBoundsCorner,
} from './geo.js';

export { isCriticalEarthquake } from './critical.js';

export { matchesSoundAlertCriteria, type SoundAlertFilter } from './soundAlert.js';

export {
  createApiResponse,
  buildQueryString,
} from './api.js';

export {
  extractUsgsEarthquakeFeatures,
  mapFeatureToEarthquake,
  mapFeaturesToEarthquakes,
} from './earthquake.js';

export {
  EARTHQUAKE_TIME_RANGE_OPTIONS,
  getTimeRangeLabel,
  isLiveTimeRange,
  resolveTimeRangeStart,
  type TimeRangeOption,
} from './timeRange.js';

export {
  filterEarthquakesByTimeRange,
  resolveTimeRangeEarthquakes,
} from './timeRangeCoverage.js';

export {
  buildMacroseismicIntensityMap,
  mergeIntensityMapPayload,
  estimateIntensityAtCoordinate,
  getMacroseismicIntensityColor,
  intensityLevelToRoman,
  intensityRomanToLevel,
  interpolateShakeMapColor,
  MACROSEISMIC_INTENSITY_LEGEND,
  parseMacroseismicObservations,
  SHAKEMAP_LEGEND_COLUMNS,
  type MacroseismicIntensityMapData,
  type MacroseismicIntensityZone,
} from './macroseismicIntensity.js';

export type { MacroseismicObservation } from '@earthquake/shared-types';

export {
  estimateShakeMapIntensity,
  getShakeMapBounds,
  getShakeMapColorForLevel,
  type ShakeMapLegendColumn,
} from './shakeMap.js';

export {
  buildPhivolcsMonthlyArchiveUrl,
  listPhivolcsArchiveMonths,
  listPhivolcsArchiveMonthsForFetch,
  parsePhivolcsSlugMonth,
  PHIVOLCS_ARCHIVE_EARLIEST_YEAR,
  type PhivolcsArchiveMonth,
} from './phivolcsArchive.js';

export {
  EARTHQUAKE_DATA_SOURCE_OPTIONS,
  getDataSourceLabel,
  isPhivolcsSource,
} from './dataSource.js';
