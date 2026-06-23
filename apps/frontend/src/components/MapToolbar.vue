<template>
  <div class="flex flex-wrap items-center gap-2">
    <button
      type="button"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
      @click="$emit('fit-all')"
    >
      <Icon icon="lucide:maximize-2" class="h-4 w-4 shrink-0" />
      Fit all events
    </button>
    <button
      type="button"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      @click="$emit('reset-view')"
    >
      <Icon icon="lucide:compass" class="h-4 w-4 shrink-0" />
      Reset view
    </button>
    <label class="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
      <Icon icon="lucide:git-branch" class="h-4 w-4 shrink-0 text-slate-600" />
      <span class="text-sm font-semibold text-slate-700">Plate boundaries</span>
      <button
        type="button"
        role="switch"
        class="relative h-5 w-9 rounded-full transition-colors"
        :class="showPlateBoundaries ? 'bg-blue-600' : 'bg-slate-300'"
        :aria-checked="showPlateBoundaries"
        @click="onTogglePlateBoundaries"
      >
        <span
          class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
          :class="showPlateBoundaries ? 'left-4' : 'left-0.5'"
        />
      </button>
    </label>
    <label class="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
      <Icon icon="lucide:layers" class="h-4 w-4 shrink-0 text-slate-600" />
      <span class="text-sm font-semibold text-slate-700">Group pins</span>
      <button
        type="button"
        role="switch"
        class="relative h-5 w-9 rounded-full transition-colors"
        :class="groupMarkers ? 'bg-blue-600' : 'bg-slate-300'"
        :aria-checked="groupMarkers"
        @click="onToggleGroupMarkers"
      >
        <span
          class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
          :class="groupMarkers ? 'left-4' : 'left-0.5'"
        />
      </button>
    </label>
    <span v-if="eventCount > 0" class="whitespace-nowrap text-xs text-slate-500">
      {{ eventCount }} markers visible
    </span>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';

const props = defineProps<{
  eventCount: number;
  groupMarkers: boolean;
  showPlateBoundaries: boolean;
}>();

const emit = defineEmits<{
  'fit-all': [];
  'reset-view': [];
  'update:groupMarkers': [value: boolean];
  'update:showPlateBoundaries': [value: boolean];
}>();

function onToggleGroupMarkers(): void {
  emit('update:groupMarkers', !props.groupMarkers);
}

function onTogglePlateBoundaries(): void {
  emit('update:showPlateBoundaries', !props.showPlateBoundaries);
}
</script>
