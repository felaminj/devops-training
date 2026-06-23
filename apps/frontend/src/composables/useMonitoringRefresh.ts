import { useRoute } from 'vue-router';
import { useEarthquakeStore } from '@/stores/earthquakeStore';

export function useMonitoringRefresh() {
  const route = useRoute();
  const earthquakeStore = useEarthquakeStore();

  async function refreshCurrentView(silent = false): Promise<void> {
    if (route.path.includes('/map')) {
      await earthquakeStore.loadLatestForMap(silent);
      return;
    }
    if (route.name === 'dashboard') {
      await Promise.all([
        earthquakeStore.loadLatest(silent),
        earthquakeStore.loadStats(),
      ]);
    }
  }

  return { refreshCurrentView };
}
