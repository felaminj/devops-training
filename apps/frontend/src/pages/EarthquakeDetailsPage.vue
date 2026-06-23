<template>
  <section class="space-y-5">
    <button
      type="button"
      class="text-sm text-slate-600 transition-colors hover:text-blue-600"
      @click="router.push({ name: 'dashboard' })"
    >
      ← Back to dashboard
    </button>
    <ErrorAlert
      v-if="store.hasError"
      :message="store.error ?? 'Unknown error'"
      dismissible
      @dismiss="store.clearError()"
    />
    <AppLoadingState v-if="store.loading" message="Loading earthquake details..." />
    <article v-else-if="store.selectedEarthquake" :class="SURFACE_CARD_CLASS" class="p-4 sm:p-6">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <span
          class="rounded-full px-3 py-1 text-sm font-semibold text-white"
          :style="{ backgroundColor: magnitudeColor }"
        >
          M {{ formattedMagnitude }}
        </span>
        <h2 class="text-xl font-bold text-slate-900 sm:text-2xl">{{ store.selectedEarthquake.place }}</h2>
      </div>
      <div class="h-px w-full bg-slate-200" />
      <dl class="mt-4 grid gap-4 sm:grid-cols-2">
        <div v-for="item in detailItems" :key="item.label">
          <dt class="text-sm text-slate-500">{{ item.label }}</dt>
          <dd class="mt-1 text-sm font-semibold text-slate-900">{{ item.value }}</dd>
        </div>
      </dl>
      <a
        v-if="store.selectedEarthquake.url"
        :href="store.selectedEarthquake.url"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        {{ externalLinkLabel }}
      </a>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLoadingState from '@/components/AppLoadingState.vue';
import ErrorAlert from '@/components/ErrorAlert.vue';
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';
import { useEarthquakeStore } from '@/stores/earthquakeStore';
import {
  formatCoordinates,
  formatDepth,
  formatMagnitude,
  formatTimestamp,
  getMagnitudeHexColor,
} from '@earthquake/shared-utils';

const route = useRoute();
const router = useRouter();
const store = useEarthquakeStore();

const formattedMagnitude = computed(() =>
  formatMagnitude(store.selectedEarthquake?.magnitude ?? null)
);
const magnitudeColor = computed(() =>
  getMagnitudeHexColor(store.selectedEarthquake?.magnitude ?? null)
);

function formatOptionalYesNo(value: boolean | null | undefined): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unknown';
}

const externalLinkLabel = computed(() => (
  store.selectedEarthquake?.dataSource === 'phivolcs' ? 'View on PHIVOLCS' : 'View on USGS'
));

const detailItems = computed(() => {
  const earthquake = store.selectedEarthquake;
  if (!earthquake) return [];
  const items = [
    { label: 'Event ID', value: earthquake.id },
    { label: 'Source', value: earthquake.dataSource === 'phivolcs' ? 'PHIVOLCS' : 'USGS' },
    { label: 'Time', value: formatTimestamp(earthquake.time) },
    {
      label: 'Coordinates',
      value: formatCoordinates(earthquake.latitude, earthquake.longitude),
    },
    { label: 'Depth', value: formatDepth(earthquake.depth) },
    { label: 'Status', value: earthquake.status },
  ];
  if (earthquake.dataSource === 'phivolcs') {
    if (earthquake.instrumentalIntensity) {
      items.push({ label: 'Instrumental intensity', value: earthquake.instrumentalIntensity });
    }
    if (earthquake.origin) items.push({ label: 'Origin', value: earthquake.origin });
    items.push({ label: 'Damage expected', value: formatOptionalYesNo(earthquake.expectingDamage) });
    items.push({ label: 'Aftershocks expected', value: formatOptionalYesNo(earthquake.expectingAftershocks) });
    return items;
  }
  items.push({ label: 'Tsunami', value: earthquake.tsunami ? 'Yes' : 'No' });
  return items;
});

async function loadFromRoute(): Promise<void> {
  const id = route.params.id;
  if (typeof id === 'string') {
    await store.loadById(id);
  }
}

onMounted(() => {
  void loadFromRoute();
});

watch(
  () => route.params.id,
  () => {
    void loadFromRoute();
  }
);
</script>
