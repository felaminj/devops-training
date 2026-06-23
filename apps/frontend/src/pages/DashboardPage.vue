<template>
  <section class="space-y-5">
    <DashboardHeader
      :stats="store.stats"
      :refreshing="store.refreshing"
      :time-range-label="timeRangeLabel"
      :source-title="sourceTitle"
    />
    <FilterToolbar
      v-model:time-range="timeRange"
      v-model:search="search"
      v-model:min-magnitude="minMagnitude"
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      @apply="applyFilters"
    />
    <WarningAlert
      v-if="store.hasWarning"
      :message="store.warning ?? ''"
      dismissible
      @dismiss="store.clearWarning()"
    />
    <ErrorAlert
      v-if="store.hasError"
      :message="store.error ?? 'Unknown error'"
      dismissible
      @dismiss="store.clearError()"
    />
    <AppLoadingState v-if="store.loading && store.earthquakes.length === 0" />
    <template v-else>
      <EarthquakeTable v-if="store.earthquakes.length" :earthquakes="store.earthquakes" />
      <AppEmptyState
        v-else
        title="No earthquakes found"
        description="Try adjusting your search or magnitude filters."
      />
      <div v-if="store.earthquakes.length" :class="SURFACE_CARD_CLASS" class="p-4">
        <Pagination :pagination="store.pagination" @page-change="onPageChange" />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { getDataSourceLabel, getTimeRangeLabel } from '@earthquake/shared-utils';
import AppEmptyState from '@/components/AppEmptyState.vue';
import AppLoadingState from '@/components/AppLoadingState.vue';
import DashboardHeader from '@/components/DashboardHeader.vue';
import EarthquakeTable from '@/components/EarthquakeTable.vue';
import ErrorAlert from '@/components/ErrorAlert.vue';
import WarningAlert from '@/components/WarningAlert.vue';
import FilterToolbar from '@/components/FilterToolbar.vue';
import Pagination from '@/components/Pagination.vue';
import { useAutoRefresh } from '@/composables/useAutoRefresh';
import { EARTHQUAKE_POLL_INTERVAL_MS } from '@/constants/polling';
import { useEarthquakeFilters } from '@/composables/useEarthquakeFilters';
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';
import { useEarthquakeStore } from '@/stores/earthquakeStore';

const store = useEarthquakeStore();
const { timeRange, search, minMagnitude, sortBy, sortOrder, applyFilters } = useEarthquakeFilters();
const dataSource = computed(() => store.filters.dataSource ?? 'usgs');
const timeRangeLabel = computed(() => getTimeRangeLabel(timeRange.value).toLowerCase());
const sourceTitle = computed(() => `${getDataSourceLabel(dataSource.value)} Earthquake Feed`);

async function refreshData(fromPoll = false): Promise<void> {
  const silent = fromPoll && store.earthquakes.length > 0;
  await Promise.all([store.loadLatest(silent), store.loadStats()]);
}

function onPageChange(page: number): void {
  store.updateFilters({ page });
  void store.loadLatest();
}

onMounted(() => {
  void refreshData();
});

useAutoRefresh(() => refreshData(true), EARTHQUAKE_POLL_INTERVAL_MS);
</script>
