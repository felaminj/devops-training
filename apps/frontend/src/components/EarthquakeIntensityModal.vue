<template>
  <Teleport to="body">
    <div
      v-if="modelValue && earthquake"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="earthquake-intensity-modal-title"
      @click.self="onClose"
    >
      <div class="flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div class="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-5">
          <div class="flex min-w-0 flex-1 items-start gap-4">
            <div
              class="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-lg ring-4 ring-white"
              :style="{ backgroundColor: magnitudeColor }"
              :aria-label="`Magnitude ${formattedMagnitude}`"
            >
              <span class="text-[11px] font-bold uppercase tracking-widest text-white/90">M</span>
              <span class="text-4xl font-extrabold leading-none">{{ formattedMagnitude }}</span>
            </div>
            <div class="min-w-0 pt-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700"
                >
                  {{ sourceLabel }}
                </span>
                <span
                  v-if="intensityPayload"
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  :class="sourceBadgeClass"
                >
                  {{ sourceBadge }}
                </span>
              </div>
              <h2 id="earthquake-intensity-modal-title" class="mt-2 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                {{ earthquake.place }}
              </h2>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Close"
            @click="onClose"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <div class="overflow-y-auto px-5 py-4">
          <EarthquakeEventDetails :earthquake="earthquake" hide-magnitude />
          <div class="mt-5 border-t border-slate-200 pt-4">
            <h3 class="text-sm font-semibold text-slate-900">Intensity map</h3>
            <div v-if="loading" class="mt-3 flex min-h-40 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
              <LoadingSpinner />
            </div>
            <div
              v-else-if="intensityUnavailable"
              class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {{ intensityMessage }}
            </div>
            <template v-else-if="intensityPayload">
              <p v-if="intensityPayload.note" class="mt-2 text-xs text-slate-500">{{ intensityPayload.note }}</p>
              <div ref="mapContainer" class="modal-intensity-map mt-3 h-[min(42vh,360px)] min-h-[240px] overflow-hidden rounded-lg border border-slate-200" />
              <div class="mt-3 flex flex-wrap items-end justify-between gap-3">
                <MapMacroseismicIntensityLegend />
                <a
                  v-if="earthquake.url"
                  :href="earthquake.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  {{ externalLinkLabel }}
                </a>
              </div>
              <ul v-if="intensityPayload.observations.length" class="mt-3 flex flex-wrap gap-2">
                <li
                  v-for="observation in intensityPayload.observations"
                  :key="`${observation.intensityRoman}-${observation.place}`"
                  class="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700"
                >
                  <span class="font-semibold text-slate-900">{{ observation.intensityRoman }}</span>
                  <span class="text-slate-500"> · </span>
                  <span>{{ observation.place }}</span>
                </li>
              </ul>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import type { Earthquake, IntensityMapPayload } from '@earthquake/shared-types';
import { useIntensityModalMap } from '@/composables/useIntensityModalMap';
import EarthquakeEventDetails from '@/components/EarthquakeEventDetails.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import MapMacroseismicIntensityLegend from '@/components/MapMacroseismicIntensityLegend.vue';
import {
  formatMagnitude,
  getMagnitudeHexColor,
} from '@earthquake/shared-utils';

const props = defineProps<{
  modelValue: boolean;
  loading: boolean;
  earthquake: Earthquake | null;
  intensityPayload: IntensityMapPayload | null;
  intensityUnavailable: boolean;
  intensityMessage: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const mapContainer = ref<HTMLElement | null>(null);
const earthquakeRef = toRef(props, 'earthquake');
const intensityPayloadRef = toRef(props, 'intensityPayload');
const isMapActive = computed(() => props.modelValue && !!props.intensityPayload && !props.loading);

useIntensityModalMap(mapContainer, earthquakeRef, intensityPayloadRef, isMapActive);

const formattedMagnitude = computed(() => formatMagnitude(props.earthquake?.magnitude ?? null));
const magnitudeColor = computed(() => getMagnitudeHexColor(props.earthquake?.magnitude ?? null));
const sourceLabel = computed(() => (
  props.earthquake?.dataSource === 'phivolcs' ? 'PHIVOLCS' : 'USGS'
));
const externalLinkLabel = computed(() => (
  props.earthquake?.dataSource === 'phivolcs' ? 'View on PHIVOLCS' : 'View on USGS'
));

const sourceBadge = computed(() => {
  const source = props.intensityPayload?.source;
  if (source === 'phivolcs-official') return 'PHIVOLCS';
  if (source === 'usgs-shakemap') return 'ShakeMap';
  return '';
});

const sourceBadgeClass = computed(() => {
  const source = props.intensityPayload?.source;
  if (source === 'phivolcs-official') return 'bg-emerald-100 text-emerald-800';
  if (source === 'usgs-shakemap') return 'bg-blue-100 text-blue-800';
  return '';
});

function onClose(): void {
  emit('update:modelValue', false);
}

watch(() => props.modelValue, (open, _, onCleanup) => {
  if (!open) return;
  const onEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', onEscape);
  onCleanup(() => window.removeEventListener('keydown', onEscape));
});
</script>
