<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      :aria-expanded="isOpen"
      @click="togglePanel"
    >
      <Icon icon="lucide:layers-2" class="h-4 w-4 shrink-0 text-slate-600" />
      Geology layers
      <span
        v-if="enabledTotal > 0"
        class="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700"
      >
        {{ enabledTotal }}
      </span>
      <Icon icon="lucide:chevron-down" class="h-4 w-4 shrink-0 text-slate-500" />
    </button>
    <div
      v-if="isOpen"
      :class="SURFACE_CARD_CLASS"
      class="absolute right-0 top-full z-50 mt-2 w-[min(92vw,360px)] p-3 shadow-lg"
    >
      <p class="text-sm font-semibold text-slate-900">Local geology overlays</p>
      <p class="mt-1 text-xs text-slate-500">
        PHIVOLCS keeps Philippine fault lines only. USGS also enables local trenches and volcanoes by default.
      </p>
      <div class="mt-3 space-y-4">
        <section v-for="section in sections" :key="section.id">
          <div class="mb-2 flex items-center gap-2">
            <Icon :icon="section.icon" class="h-4 w-4 text-slate-500" />
            <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ section.title }}</h3>
          </div>
          <div v-if="section.loading" class="flex items-center gap-2 text-xs text-slate-500">
            <Icon icon="lucide:loader-2" class="h-4 w-4 animate-spin" />
            Loading catalog...
          </div>
          <p v-else-if="section.error" class="text-xs text-red-600">{{ section.error }}</p>
          <ul v-else class="max-h-40 space-y-1 overflow-y-auto">
            <li v-for="layer in section.layers" :key="layer.id">
              <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  :checked="section.isEnabled(layer.id)"
                  @change="section.onToggle(layer.id)"
                />
                <span class="flex-1 text-sm text-slate-700">{{ layer.name }}</span>
                <span v-if="section.isLoading(layer.id)" class="text-xs text-slate-400">Downloading...</span>
                <span v-else class="text-xs text-slate-400">{{ layer.featureCount }}</span>
              </label>
            </li>
          </ul>
        </section>
      </div>
      <p v-if="attribution" class="mt-3 border-t border-slate-200 pt-2 text-[10px] leading-relaxed text-slate-400">
        {{ attribution }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useGeoLayerManifest } from '@/composables/useGeoLayerManifest';
import { FAULT_LAYERS_INDEX_URL } from '@/constants/faultLayers';
import { TRENCH_LAYERS_INDEX_URL } from '@/constants/trenchLayers';
import { VOLCANO_LAYERS_INDEX_URL } from '@/constants/volcanoLayers';
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';

const props = defineProps<{
  enabledFaultLayerIds: string[];
  loadingFaultLayerIds: string[];
  enabledTrenchLayerIds: string[];
  loadingTrenchLayerIds: string[];
  enabledVolcanoLayerIds: string[];
  loadingVolcanoLayerIds: string[];
}>();

const emit = defineEmits<{
  'toggle-fault-layer': [layerId: string];
  'toggle-trench-layer': [layerId: string];
  'toggle-volcano-layer': [layerId: string];
}>();

const faultManifest = useGeoLayerManifest(FAULT_LAYERS_INDEX_URL);
const trenchManifest = useGeoLayerManifest(TRENCH_LAYERS_INDEX_URL);
const volcanoManifest = useGeoLayerManifest(VOLCANO_LAYERS_INDEX_URL);
const isOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const enabledTotal = computed(() => (
  props.enabledFaultLayerIds.length
  + props.enabledTrenchLayerIds.length
  + props.enabledVolcanoLayerIds.length
));

const attribution = computed(() => (
  [faultManifest.manifest.value?.attribution, trenchManifest.manifest.value?.attribution, volcanoManifest.manifest.value?.attribution]
    .filter(Boolean)
    .join(' · ')
));

const sections = computed(() => [
  {
    id: 'faults',
    title: 'Fault lines',
    icon: 'lucide:git-branch',
    layers: faultManifest.manifest.value?.layers ?? [],
    loading: faultManifest.loading.value,
    error: faultManifest.error.value,
    isEnabled: (id: string) => props.enabledFaultLayerIds.includes(id),
    isLoading: (id: string) => props.loadingFaultLayerIds.includes(id),
    onToggle: (id: string) => emit('toggle-fault-layer', id),
  },
  {
    id: 'trenches',
    title: 'Ocean trenches',
    icon: 'lucide:waves',
    layers: trenchManifest.manifest.value?.layers ?? [],
    loading: trenchManifest.loading.value,
    error: trenchManifest.error.value,
    isEnabled: (id: string) => props.enabledTrenchLayerIds.includes(id),
    isLoading: (id: string) => props.loadingTrenchLayerIds.includes(id),
    onToggle: (id: string) => emit('toggle-trench-layer', id),
  },
  {
    id: 'volcanoes',
    title: 'Volcanoes',
    icon: 'lucide:mountain',
    layers: volcanoManifest.manifest.value?.layers ?? [],
    loading: volcanoManifest.loading.value,
    error: volcanoManifest.error.value,
    isEnabled: (id: string) => props.enabledVolcanoLayerIds.includes(id),
    isLoading: (id: string) => props.loadingVolcanoLayerIds.includes(id),
    onToggle: (id: string) => emit('toggle-volcano-layer', id),
  },
]);

function togglePanel(): void {
  isOpen.value = !isOpen.value;
}

function handleDocumentClick(event: MouseEvent): void {
  if (!isOpen.value || !rootRef.value) return;
  const target = event.target;
  if (target instanceof Node && rootRef.value.contains(target)) return;
  isOpen.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>
