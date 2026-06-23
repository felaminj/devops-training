import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  DashboardStats,
  Earthquake,
  EarthquakeFilters,
  Pagination,
} from '@earthquake/shared-types';
import {
  fetchAllLatestEarthquakes,
  fetchDashboardStats,
  fetchEarthquakeById,
  fetchLatestEarthquakes,
} from '@/services/earthquakeService';
import { getApiErrorMessage } from '@/services/apiError';
import { useMonitoringPreferencesStore } from '@/stores/monitoringPreferencesStore';

function getMergedFilters(base: EarthquakeFilters): EarthquakeFilters {
  const preferences = useMonitoringPreferencesStore();
  return { ...base, ...preferences.toEarthquakeFilters() };
}

const defaultPagination: Pagination = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const useEarthquakeStore = defineStore('earthquake', () => {
  const earthquakes = ref<Earthquake[]>([]);
  const selectedEarthquake = ref<Earthquake | null>(null);
  const stats = ref<DashboardStats | null>(null);
  const pagination = ref<Pagination>({ ...defaultPagination });
  const filters = ref<EarthquakeFilters>({
    page: 1,
    pageSize: 10,
    sortBy: 'time',
    sortOrder: 'desc',
    timeRange: '24h',
    dataSource: 'usgs',
  });
  const loading = ref(false);
  const refreshing = ref(false);
  const error = ref<string | null>(null);
  const warning = ref<string | null>(null);

  const hasError = computed(() => error.value !== null);
  const hasWarning = computed(() => warning.value !== null);

  function applyTimeRangeWarning(message: string | null | undefined): void {
    warning.value = message ?? null;
  }

  function beginLoad(silent: boolean, hasData: boolean): void {
    if (silent && hasData) refreshing.value = true;
    else loading.value = true;
  }

  function endLoad(silent: boolean, hasData: boolean): void {
    if (silent && hasData) refreshing.value = false;
    else loading.value = false;
  }

  async function loadLatest(silent = false): Promise<void> {
    const hasData = earthquakes.value.length > 0;
    beginLoad(silent, hasData);
    error.value = null;
    warning.value = null;
    try {
      const data = await fetchLatestEarthquakes(getMergedFilters(filters.value));
      earthquakes.value = data.items;
      pagination.value = data.pagination;
      applyTimeRangeWarning(data.timeRangeCoverage?.message);
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Failed to load earthquakes');
    } finally {
      endLoad(silent, hasData);
    }
  }

  async function loadLatestForMap(silent = false): Promise<void> {
    const hasData = earthquakes.value.length > 0;
    beginLoad(silent, hasData);
    error.value = null;
    warning.value = null;
    try {
      const data = await fetchAllLatestEarthquakes(getMergedFilters(filters.value));
      earthquakes.value = data.items;
      pagination.value = {
        page: 1,
        pageSize: data.items.length,
        totalItems: data.items.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      applyTimeRangeWarning(data.timeRangeCoverage?.message);
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Failed to load earthquakes for map');
    } finally {
      endLoad(silent, hasData);
    }
  }

  async function loadStats(): Promise<void> {
    try {
      const merged = getMergedFilters(filters.value);
      const timeRange = merged.timeRange ?? '24h';
      const dataSource = merged.dataSource ?? 'usgs';
      stats.value = await fetchDashboardStats(timeRange, dataSource);
      if (!warning.value) applyTimeRangeWarning(stats.value?.timeRangeCoverage?.message);
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Failed to load dashboard stats');
    }
  }

  async function loadById(id: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      selectedEarthquake.value = await fetchEarthquakeById(id);
    } catch (err) {
      selectedEarthquake.value = null;
      error.value = getApiErrorMessage(err, 'Failed to load earthquake details');
    } finally {
      loading.value = false;
    }
  }

  function updateFilters(next: Partial<EarthquakeFilters>): void {
    filters.value = { ...filters.value, ...next };
  }

  function clearError(): void {
    error.value = null;
  }

  function clearWarning(): void {
    warning.value = null;
  }

  return {
    earthquakes,
    selectedEarthquake,
    stats,
    pagination,
    filters,
    loading,
    refreshing,
    error,
    warning,
    hasError,
    hasWarning,
    loadLatest,
    loadLatestForMap,
    loadStats,
    loadById,
    updateFilters,
    clearError,
    clearWarning,
  };
});
