import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import type { Earthquake } from '@earthquake/shared-types';
import { isLiveTimeRange } from '@earthquake/shared-utils';
import { EARTHQUAKE_POLL_INTERVAL_MS, NEW_EARTHQUAKE_PULSE_MS } from '@/constants/polling';
import { useAutoRefresh } from '@/composables/useAutoRefresh';
import { useEarthquakeNotifications } from '@/composables/useEarthquakeNotifications';
import { useEarthquakeSoundAlert } from '@/composables/useEarthquakeSoundAlert';
import { useEarthquakeStore } from '@/stores/earthquakeStore';

type MapRef = {
  fitBounds?: () => void;
  resetView?: () => void;
  refreshLayout?: () => void;
  locateEarthquake?: (earthquake: Earthquake) => void;
} | null;

type MapRefreshOptions = {
  earthquakes: Ref<Earthquake[]>;
  mapRef: Ref<MapRef>;
  loadLatestForMap: (silent?: boolean) => Promise<void>;
  loadStats: () => Promise<void>;
};

function sortByTimeDesc(items: Earthquake[]): Earthquake[] {
  return [...items].sort((a, b) => b.time - a.time);
}

export function useEarthquakeMapPolling(options: MapRefreshOptions) {
  const { earthquakes, mapRef, loadLatestForMap, loadStats } = options;
  const earthquakeStore = useEarthquakeStore();
  const lastRefreshedAt = ref<Date | null>(null);
  const isAlertOpen = ref(false);
  const alertEarthquakes = ref<Earthquake[]>([]);
  const newlyAddedIds = ref<string[]>([]);
  const pulseTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  const notifiedIds = ref(new Set<string>());
  const hasBaseline = ref(false);
  const { notifyCriticalEarthquakes, markNotified } = useEarthquakeNotifications();
  const { playAlertsForEarthquakes, markSounded } = useEarthquakeSoundAlert();

  function clearPulseHighlights(): void {
    pulseTimeouts.forEach((timeout) => clearTimeout(timeout));
    pulseTimeouts.clear();
    newlyAddedIds.value = [];
  }

  function startPulseForIds(ids: string[]): void {
    if (ids.length === 0) return;
    const active = new Set(newlyAddedIds.value);
    ids.forEach((id) => {
      active.add(id);
      const existingTimeout = pulseTimeouts.get(id);
      if (existingTimeout) clearTimeout(existingTimeout);
      pulseTimeouts.set(id, setTimeout(() => {
        pulseTimeouts.delete(id);
        newlyAddedIds.value = newlyAddedIds.value.filter((item) => item !== id);
      }, NEW_EARTHQUAKE_PULSE_MS));
    });
    newlyAddedIds.value = [...active];
  }

  function resetDetectionBaseline(): void {
    hasBaseline.value = false;
    clearPulseHighlights();
  }

  watch(
    () => [earthquakeStore.filters.dataSource, earthquakeStore.filters.timeRange] as const,
    () => resetDetectionBaseline()
  );

  function mergeNewAlerts(detected: Earthquake[]): void {
    const alertIds = new Set(alertEarthquakes.value.map((eq) => eq.id));
    const toAdd = detected.filter((eq) => !notifiedIds.value.has(eq.id) && !alertIds.has(eq.id));
    if (toAdd.length === 0) return;
    alertEarthquakes.value = sortByTimeDesc([...alertEarthquakes.value, ...toAdd]);
    startPulseForIds(toAdd.map((eq) => eq.id));
    isAlertOpen.value = true;
    playAlertsForEarthquakes(toAdd);
    notifyCriticalEarthquakes(toAdd);
  }

  function dismissNewEarthquakeAlert(): void {
    const ids = alertEarthquakes.value.map((eq) => eq.id);
    markSounded(ids);
    markNotified(ids);
    alertEarthquakes.value.forEach((eq) => notifiedIds.value.add(eq.id));
    alertEarthquakes.value = [];
    isAlertOpen.value = false;
  }

  function clearNewlyAddedHighlight(): void {
    clearPulseHighlights();
  }

  async function refreshMapData(fromPoll: boolean): Promise<void> {
    const previousIds = new Set(earthquakes.value.map((eq) => eq.id));
    const silent = fromPoll && hasBaseline.value;
    await Promise.all([loadLatestForMap(silent), loadStats()]);
    lastRefreshedAt.value = new Date();
    const timeRange = earthquakeStore.filters.timeRange ?? '24h';
    if (fromPoll && hasBaseline.value && isLiveTimeRange(timeRange)) {
      const detected = earthquakes.value.filter((eq) => !previousIds.has(eq.id));
      mergeNewAlerts(detected);
    }
    hasBaseline.value = true;
    window.setTimeout(() => mapRef.value?.refreshLayout?.(), 150);
  }

  onMounted(() => {
    void refreshMapData(false);
  });

  onUnmounted(() => {
    clearPulseHighlights();
  });

  useAutoRefresh(() => refreshMapData(true), EARTHQUAKE_POLL_INTERVAL_MS);

  return {
    lastRefreshedAt,
    isAlertOpen,
    alertEarthquakes,
    newlyAddedIds,
    dismissNewEarthquakeAlert,
    clearNewlyAddedHighlight,
    pollIntervalMs: EARTHQUAKE_POLL_INTERVAL_MS,
  };
}
