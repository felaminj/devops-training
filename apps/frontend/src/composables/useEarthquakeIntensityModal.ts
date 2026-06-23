import { ref } from 'vue';
import type { Earthquake, IntensityMapPayload } from '@earthquake/shared-types';
import { useModalBodyScrollLock } from '@/composables/useModalBodyScrollLock';
import { fetchEarthquakeById } from '@/services/earthquakeService';
import { fetchIntensityMap } from '@/services/intensityMapService';
import { getApiErrorMessage } from '@/services/apiError';

export function useEarthquakeIntensityModal() {
  const isOpen = ref(false);
  const loading = ref(false);
  const earthquake = ref<Earthquake | null>(null);
  const intensityPayload = ref<IntensityMapPayload | null>(null);
  const intensityUnavailable = ref(false);
  const intensityMessage = ref('No official intensity map is available for this event.');

  useModalBodyScrollLock(isOpen);

  async function resolveEarthquakeDetails(selected: Earthquake): Promise<Earthquake> {
    try {
      return await fetchEarthquakeById(selected.id);
    } catch {
      return selected;
    }
  }

  async function open(selected: Earthquake): Promise<void> {
    isOpen.value = true;
    loading.value = true;
    earthquake.value = selected;
    intensityPayload.value = null;
    intensityUnavailable.value = false;
    intensityMessage.value = 'No official intensity map is available for this event.';
    try {
      const detailed = await resolveEarthquakeDetails(selected);
      earthquake.value = detailed;
      try {
        const payload = await fetchIntensityMap(detailed.id);
        if (!payload.imageUrl || !payload.bounds || payload.source === 'modeled') {
          intensityUnavailable.value = true;
          return;
        }
        intensityPayload.value = payload;
      } catch (error) {
        intensityUnavailable.value = true;
        const apiMessage = getApiErrorMessage(error, '');
        const normalizedMessage = apiMessage.toLowerCase();
        const isUnavailableIntensityMap =
          normalizedMessage.includes('not found')
          || normalizedMessage.includes('no official intensity map')
          || normalizedMessage.includes('failed to fetch earthquake details');
        intensityMessage.value = isUnavailableIntensityMap
          ? 'No official intensity map is available for this event.'
          : apiMessage || 'No official intensity map is available for this event.';
      }
    } finally {
      loading.value = false;
    }
  }

  function close(): void {
    isOpen.value = false;
    loading.value = false;
    earthquake.value = null;
    intensityPayload.value = null;
    intensityUnavailable.value = false;
  }

  return {
    isOpen,
    loading,
    earthquake,
    intensityPayload,
    intensityUnavailable,
    intensityMessage,
    open,
    close,
  };
}
