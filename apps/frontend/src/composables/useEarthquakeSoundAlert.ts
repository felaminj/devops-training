import { ref } from 'vue';
import type { Earthquake } from '@earthquake/shared-types';
import { matchesSoundAlertCriteria } from '@earthquake/shared-utils';
import { useMonitoringPreferencesStore } from '@/stores/monitoringPreferencesStore';
import { scheduleEmergencySirenSound } from '@/utils/emergencySirenSound';

const WARNING_DURATION_SEC = 30;
const soundedIds = new Set<string>();
let audioContext: AudioContext | null = null;
let activeWarningNodes: AudioScheduledSourceNode[] = [];
let warningStopTimeout: ReturnType<typeof setTimeout> | null = null;
const isWarningPlaying = ref(false);

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext
    ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  return audioContext;
}

async function resumeAudioContext(): Promise<void> {
  const context = getAudioContext();
  if (!context || context.state !== 'suspended') return;
  await context.resume();
}

function stopWarningSound(): void {
  if (warningStopTimeout) {
    clearTimeout(warningStopTimeout);
    warningStopTimeout = null;
  }
  activeWarningNodes.forEach((node) => {
    try {
      node.stop();
    } catch {
      // Node may already be stopped.
    }
  });
  activeWarningNodes = [];
  isWarningPlaying.value = false;
}

function playWarningSound(): void {
  const context = getAudioContext();
  if (!context) return;
  stopWarningSound();
  const start = context.currentTime;
  const playback = scheduleEmergencySirenSound(context, start, WARNING_DURATION_SEC);
  activeWarningNodes = playback.sources;
  isWarningPlaying.value = true;
  warningStopTimeout = setTimeout(() => {
    activeWarningNodes = [];
    warningStopTimeout = null;
    isWarningPlaying.value = false;
  }, WARNING_DURATION_SEC * 1000);
}

export function useEarthquakeSoundAlert() {
  const preferences = useMonitoringPreferencesStore();

  function isSupported(): boolean {
    return typeof window !== 'undefined' && !!getAudioContext();
  }

  function getSoundAlertFilter() {
    return {
      minMagnitude: preferences.soundAlertMinMagnitude,
      nearMeActive: preferences.nearMeActive,
      userLocation: preferences.userLocation,
      radiusKm: preferences.radiusKm,
    };
  }

  function filterAlertEarthquakes(earthquakes: Earthquake[]): Earthquake[] {
    if (!preferences.soundAlertsEnabled) return [];
    const filter = getSoundAlertFilter();
    return earthquakes.filter((earthquake) => matchesSoundAlertCriteria(earthquake, filter));
  }

  async function playTestSound(): Promise<void> {
    await resumeAudioContext();
    playWarningSound();
  }

  async function enableSoundAlerts(): Promise<void> {
    preferences.soundAlertsEnabled = true;
    await resumeAudioContext();
  }

  function disableSoundAlerts(): void {
    preferences.soundAlertsEnabled = false;
    stopWarningSound();
  }

  function stopTestSound(): void {
    stopWarningSound();
  }

  function playAlertsForEarthquakes(earthquakes: Earthquake[]): void {
    if (!preferences.soundAlertsEnabled) return;
    const matching = filterAlertEarthquakes(earthquakes);
    const fresh = matching.filter((earthquake) => !soundedIds.has(earthquake.id));
    if (fresh.length === 0) return;
    fresh.forEach((earthquake) => soundedIds.add(earthquake.id));
    void resumeAudioContext().then(() => playWarningSound());
  }

  function markSounded(earthquakeIds: string[]): void {
    earthquakeIds.forEach((id) => soundedIds.add(id));
  }

  return {
    isSupported,
    isWarningPlaying,
    enableSoundAlerts,
    disableSoundAlerts,
    playTestSound,
    stopTestSound,
    playAlertsForEarthquakes,
    markSounded,
    filterAlertEarthquakes,
  };
}
