<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-earthquake-modal-title"
      @click.self="onDismiss"
    >
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-center gap-3">
          <Icon icon="lucide:radar" width="24" height="24" class="shrink-0 text-amber-600" />
          <div class="min-w-0">
            <h2 id="new-earthquake-modal-title" class="m-0 text-xl font-semibold text-slate-900">
              {{ headline }}
            </h2>
            <p v-if="earthquakes.length > 1" class="m-0 mt-1 text-xs text-slate-500">
              {{ earthquakes.length }} events in this alert
            </p>
          </div>
        </div>
        <p class="m-0 mb-4 text-sm text-slate-600">
          {{ description }}
        </p>
        <ModalEarthquakeMap
          :earthquakes="earthquakes"
          :focus-earthquake="focusEarthquake"
          :is-active="modelValue"
        />
        <ul class="m-0 mt-4 max-h-52 list-none space-y-2 overflow-y-auto p-0">
          <li
            v-for="earthquake in earthquakes"
            :key="earthquake.id"
            class="flex items-start justify-between gap-2 rounded-lg border px-3 py-2 transition-colors"
            :class="itemClass(earthquake.id)"
          >
            <button
              type="button"
              class="min-w-0 flex-1 text-left"
              @click="selectEarthquake(earthquake.id)"
            >
              <p class="m-0 text-sm font-semibold text-slate-900">
                M {{ formatMagnitude(earthquake.magnitude) }}
                <span v-if="isNewlyAdded(earthquake.id)" class="ml-2 text-xs font-semibold text-amber-700">
                  New
                </span>
                <span v-if="earthquake.tsunami" class="ml-2 text-xs font-semibold text-rose-700">
                  Tsunami
                </span>
                <span v-else-if="isCriticalEarthquake(earthquake)" class="ml-2 text-xs font-semibold text-rose-600">
                  Critical
                </span>
              </p>
              <p class="m-0 mt-1 truncate text-sm text-slate-600">{{ earthquake.place }}</p>
              <p class="m-0 mt-1 text-xs text-slate-500">{{ formatRelativeTime(earthquake.time) }}</p>
            </button>
            <button
              type="button"
              class="shrink-0 pt-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
              @click="onLocate(earthquake)"
            >
              Locate
            </button>
          </li>
        </ul>
        <div class="mt-5 flex gap-2">
          <button
            type="button"
            class="h-10 flex-1 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            :disabled="!focusEarthquake"
            @click="onLocateSelected"
          >
            Locate on map
          </button>
          <button
            type="button"
            class="h-10 flex-1 rounded-lg bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            @click="onDismiss"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRef, watch } from 'vue';
import { Icon } from '@iconify/vue';
import type { Earthquake } from '@earthquake/shared-types';
import { formatMagnitude, formatRelativeTime, isCriticalEarthquake } from '@earthquake/shared-utils';
import ModalEarthquakeMap from '@/components/ModalEarthquakeMap.vue';
import { useModalBodyScrollLock } from '@/composables/useModalBodyScrollLock';

const props = defineProps<{
  modelValue: boolean;
  earthquakes: Earthquake[];
  newlyAddedIds?: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  dismiss: [];
  locate: [earthquake: Earthquake];
}>();

useModalBodyScrollLock(toRef(props, 'modelValue'));

const selectedId = ref<string | null>(null);

const focusEarthquake = computed(() => {
  if (selectedId.value) {
    return props.earthquakes.find((eq) => eq.id === selectedId.value) ?? null;
  }
  return props.earthquakes[0] ?? null;
});

const headline = computed(() => {
  if (props.earthquakes.length === 1) return 'New earthquake detected';
  return `${props.earthquakes.length} new earthquakes detected`;
});

const sourceLabel = computed(() => (
  props.earthquakes[0]?.dataSource === 'phivolcs' ? 'PHIVOLCS' : 'USGS'
));

const description = computed(() => {
  if (props.earthquakes.length === 1) {
    return `${sourceLabel.value} reported new seismic activity. The pulsing pin shows the event location.`;
  }
  return 'New events are added here while this alert stays open. Select one to preview or locate it on the map.';
});

watch(() => props.earthquakes, (items, previousItems) => {
  if (items.length === 0) {
    selectedId.value = null;
    return;
  }
  const addedIds = props.newlyAddedIds ?? [];
  const newestAdded = addedIds[0];
  if (newestAdded && items.some((eq) => eq.id === newestAdded)) {
    selectedId.value = newestAdded;
    return;
  }
  const firstItem = items[0];
  if (firstItem && (!selectedId.value || !items.some((eq) => eq.id === selectedId.value))) {
    selectedId.value = firstItem.id;
  }
  if (items.length > (previousItems?.length ?? 0) && firstItem) {
    selectedId.value = firstItem.id;
  }
}, { immediate: true, deep: true });

function isNewlyAdded(earthquakeId: string): boolean {
  return (props.newlyAddedIds ?? []).includes(earthquakeId);
}

function itemClass(earthquakeId: string): string {
  if (selectedId.value === earthquakeId) return 'border-blue-300 bg-blue-50';
  if (isNewlyAdded(earthquakeId)) return 'border-amber-300 bg-amber-50';
  return 'border-slate-200 bg-slate-50 hover:bg-slate-100';
}

function selectEarthquake(earthquakeId: string): void {
  selectedId.value = earthquakeId;
}

function onLocate(earthquake: Earthquake): void {
  selectedId.value = earthquake.id;
  emit('locate', earthquake);
}

function onLocateSelected(): void {
  if (!focusEarthquake.value) return;
  emit('locate', focusEarthquake.value);
}

function onDismiss(): void {
  emit('update:modelValue', false);
  emit('dismiss');
}

function onEscapeKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !props.modelValue) return;
  onDismiss();
}

onMounted(() => {
  window.addEventListener('keydown', onEscapeKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onEscapeKey);
});
</script>
