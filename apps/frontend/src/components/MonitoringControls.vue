<template>
  <div :class="SURFACE_CARD_CLASS" class="flex flex-wrap items-center gap-3 p-4">
    <DataSourceToggle v-model:data-source="dataSource" />
    <TimeRangeFilter v-model:time-range="timeRange" />
    <button
      type="button"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition"
      :class="criticalButtonClass"
      @click="onToggleCritical"
    >
      <Icon icon="lucide:alert-triangle" class="h-4 w-4 shrink-0" />
      Critical only
    </button>
    <button
      type="button"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition"
      :class="nearMeButtonClass"
      @click="onToggleNearMe"
    >
      <Icon icon="lucide:locate-fixed" class="h-4 w-4 shrink-0" />
      Near me
    </button>
    <FilterSelect
      v-if="preferences.nearMeActive"
      v-model="radiusKmValue"
      label="Radius"
      :options="radiusOptions"
      class="min-w-[140px]"
    />
    <button
      type="button"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition"
      :class="soundAlertButtonClass"
      @click="onToggleSoundAlerts"
    >
      <Icon icon="lucide:volume-2" class="h-4 w-4 shrink-0" />
      {{ soundAlertLabel }}
    </button>
    <FilterSelect
      v-if="preferences.soundAlertsEnabled"
      v-model="soundAlertMagnitudeValue"
      label="Alert at"
      :options="soundAlertMagnitudeOptions"
      class="min-w-[120px]"
    />
    <button
      v-if="preferences.soundAlertsEnabled && isSoundAlertSupported()"
      type="button"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition"
      :class="isWarningPlaying ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'"
      @click="onTestSound"
    >
      <Icon :icon="isWarningPlaying ? 'lucide:square' : 'lucide:play'" class="h-4 w-4 shrink-0" />
      {{ isWarningPlaying ? 'Stop sound' : 'Test sound' }}
    </button>
    <button
      type="button"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition"
      :class="notificationButtonClass"
      @click="onToggleNotifications"
    >
      <Icon icon="lucide:bell" class="h-4 w-4 shrink-0" />
      {{ notificationLabel }}
    </button>
    <p v-if="preferences.locationError" class="w-full text-sm text-red-600">
      {{ preferences.locationError }}
    </p>
    <p v-if="activeSummary" class="w-full text-xs text-slate-500">
      {{ activeSummary }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import DataSourceToggle from '@/components/DataSourceToggle.vue';
import FilterSelect from '@/components/FilterSelect.vue';
import TimeRangeFilter from '@/components/TimeRangeFilter.vue';
import { useEarthquakeNotifications } from '@/composables/useEarthquakeNotifications';
import { useEarthquakeSoundAlert } from '@/composables/useEarthquakeSoundAlert';
import { useMonitoringRefresh } from '@/composables/useMonitoringRefresh';
import { useNearMe } from '@/composables/useNearMe';
import {
  DEFAULT_NEAR_ME_RADIUS_KM,
  DEFAULT_SOUND_ALERT_MIN_MAGNITUDE,
  NEAR_ME_RADIUS_OPTIONS,
  SOUND_ALERT_MAGNITUDE_OPTIONS,
} from '@/constants/monitoring';
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';
import { useEarthquakeStore } from '@/stores/earthquakeStore';
import { useMonitoringPreferencesStore } from '@/stores/monitoringPreferencesStore';
import type { EarthquakeDataSource, EarthquakeTimeRange } from '@earthquake/shared-types';
import { getDataSourceLabel, getTimeRangeLabel } from '@earthquake/shared-utils';

const preferences = useMonitoringPreferencesStore();
const earthquakeStore = useEarthquakeStore();
const { toggleNearMe } = useNearMe();
const { refreshCurrentView } = useMonitoringRefresh();
const {
  enableNotifications,
  disableNotifications,
  permission,
  isSupported,
} = useEarthquakeNotifications();
const {
  enableSoundAlerts,
  disableSoundAlerts,
  playTestSound,
  stopTestSound,
  isWarningPlaying,
  isSupported: isSoundAlertSupported,
} = useEarthquakeSoundAlert();

const dataSource = computed({
  get: () => earthquakeStore.filters.dataSource ?? 'usgs',
  set: (value: EarthquakeDataSource) => {
    earthquakeStore.updateFilters({ dataSource: value, page: 1 });
    preferences.syncGeologyLayersForDataSource(value);
    void refreshCurrentView();
  },
});

const timeRange = computed({
  get: () => earthquakeStore.filters.timeRange ?? '24h',
  set: (value: EarthquakeTimeRange) => {
    earthquakeStore.updateFilters({ timeRange: value, page: 1 });
    void refreshCurrentView();
  },
});

const radiusKmValue = computed({
  get: () => String(preferences.radiusKm),
  set: (value: string) => {
    preferences.radiusKm = Number(value) || DEFAULT_NEAR_ME_RADIUS_KM;
    void refreshCurrentView(true);
  },
});

const radiusOptions = NEAR_ME_RADIUS_OPTIONS.map((option) => ({
  value: String(option.value),
  label: option.label,
}));

const soundAlertMagnitudeOptions = SOUND_ALERT_MAGNITUDE_OPTIONS.map((option) => ({
  value: String(option.value),
  label: option.label,
}));

const soundAlertMagnitudeValue = computed({
  get: () => String(preferences.soundAlertMinMagnitude),
  set: (value: string) => {
    preferences.soundAlertMinMagnitude = Number(value) || DEFAULT_SOUND_ALERT_MIN_MAGNITUDE;
  },
});

const criticalButtonClass = computed(() =>
  preferences.criticalOnly
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
);

const nearMeButtonClass = computed(() =>
  preferences.nearMeActive
    ? 'border-blue-200 bg-blue-50 text-blue-700'
    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
);

const soundAlertButtonClass = computed(() =>
  preferences.soundAlertsEnabled
    ? 'border-violet-200 bg-violet-50 text-violet-700'
    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
);

const notificationButtonClass = computed(() =>
  preferences.notificationsEnabled
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
);

const soundAlertLabel = computed(() => {
  if (!isSoundAlertSupported()) return 'Sound unavailable';
  if (preferences.soundAlertsEnabled) return 'Sound alerts on';
  return 'Sound alerts';
});

const notificationLabel = computed(() => {
  if (!isSupported()) return 'Alerts unavailable';
  if (preferences.notificationsEnabled) return 'Background alerts on';
  if (permission.value === 'denied') return 'Enable alerts';
  return 'Background alerts';
});

const activeSummary = computed(() => {
  const parts: string[] = [
    getDataSourceLabel(dataSource.value),
    getTimeRangeLabel(timeRange.value),
  ];
  if (preferences.criticalOnly) parts.push('Showing tsunami and M5+ events only');
  if (preferences.nearMeActive) {
    parts.push(`Within ${preferences.radiusKm} km of your location`);
  }
  if (preferences.soundAlertsEnabled) {
    const nearMeScope = preferences.nearMeActive ? ' near you' : '';
    parts.push(`30s siren at M ${preferences.soundAlertMinMagnitude}+${nearMeScope}`);
  }
  if (preferences.notificationsEnabled) {
    parts.push('Push alerts when tab is in background');
  }
  return parts.join(' · ');
});

async function onToggleCritical(): Promise<void> {
  preferences.criticalOnly = !preferences.criticalOnly;
  await refreshCurrentView(preferences.criticalOnly || preferences.nearMeActive);
}

async function onToggleNearMe(): Promise<void> {
  await toggleNearMe();
  await refreshCurrentView(true);
}

async function onToggleSoundAlerts(): Promise<void> {
  if (preferences.soundAlertsEnabled) {
    disableSoundAlerts();
    return;
  }
  await enableSoundAlerts();
}

async function onTestSound(): Promise<void> {
  if (isWarningPlaying.value) {
    stopTestSound();
    return;
  }
  await playTestSound();
}

async function onToggleNotifications(): Promise<void> {
  if (preferences.notificationsEnabled) {
    disableNotifications();
    return;
  }
  await enableNotifications();
}
</script>
