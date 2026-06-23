import { computed } from 'vue';
import { useEarthquakeStore } from '@/stores/earthquakeStore';
import type { EarthquakeTimeRange, SortField, SortOrder } from '@earthquake/shared-types';

export function useEarthquakeFilters() {
  const store = useEarthquakeStore();

  const timeRange = computed({
    get: () => store.filters.timeRange ?? '24h',
    set: (value: EarthquakeTimeRange) => store.updateFilters({ timeRange: value, page: 1 }),
  });

  const search = computed({
    get: () => store.filters.search ?? '',
    set: (value: string) => store.updateFilters({ search: value, page: 1 }),
  });

  const minMagnitude = computed({
    get: () => store.filters.minMagnitude ?? 0,
    set: (value: number) => store.updateFilters({ minMagnitude: value, page: 1 }),
  });

  const sortBy = computed({
    get: () => store.filters.sortBy ?? 'time',
    set: (value: SortField) => store.updateFilters({ sortBy: value, page: 1 }),
  });

  const sortOrder = computed({
    get: () => store.filters.sortOrder ?? 'desc',
    set: (value: SortOrder) => store.updateFilters({ sortOrder: value, page: 1 }),
  });

  async function applyFilters(): Promise<void> {
    await store.loadLatest();
  }

  return {
    timeRange,
    search,
    minMagnitude,
    sortBy,
    sortOrder,
    applyFilters,
  };
}
