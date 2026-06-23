import { computed, type Ref } from 'vue';
import type { Earthquake } from '@earthquake/shared-types';
import { formatMagnitude, isSignificantMagnitude } from '@earthquake/shared-utils';

export function useMapSummary(earthquakes: Ref<Earthquake[]>) {
  const totalEvents = computed(() => earthquakes.value.length);
  const significantEvents = computed(() =>
    earthquakes.value.filter((eq) => isSignificantMagnitude(eq.magnitude)).length
  );
  const largestMagnitude = computed(() => {
    const magnitudes = earthquakes.value
      .map((eq) => eq.magnitude)
      .filter((mag): mag is number => mag !== null);
    if (magnitudes.length === 0) return 'N/A';
    return formatMagnitude(Math.max(...magnitudes));
  });
  return { totalEvents, significantEvents, largestMagnitude };
}
