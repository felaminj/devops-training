import { ref } from 'vue';
import type { Earthquake } from '@earthquake/shared-types';
import { formatMagnitude, isCriticalEarthquake } from '@earthquake/shared-utils';
import { useMonitoringPreferencesStore } from '@/stores/monitoringPreferencesStore';

const notifiedIds = new Set<string>();

export function useEarthquakeNotifications() {
  const preferences = useMonitoringPreferencesStore();
  const permission = ref<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  function isSupported(): boolean {
    return typeof Notification !== 'undefined';
  }

  async function requestPermission(): Promise<boolean> {
    if (!isSupported()) return false;
    const result = await Notification.requestPermission();
    permission.value = result;
    preferences.notificationsEnabled = result === 'granted';
    return result === 'granted';
  }

  async function enableNotifications(): Promise<boolean> {
    if (!isSupported()) return false;
    if (Notification.permission === 'granted') {
      preferences.notificationsEnabled = true;
      permission.value = 'granted';
      return true;
    }
    return requestPermission();
  }

  function disableNotifications(): void {
    preferences.notificationsEnabled = false;
  }

  function shouldNotifyInBackground(): boolean {
    return preferences.notificationsEnabled && permission.value === 'granted' && document.hidden;
  }

  function notifyCriticalEarthquakes(earthquakes: Earthquake[]): void {
    if (!shouldNotifyInBackground()) return;
    const critical = earthquakes.filter((eq) => isCriticalEarthquake(eq));
    critical.forEach((earthquake) => {
      if (notifiedIds.has(earthquake.id)) return;
      notifiedIds.add(earthquake.id);
      const tsunamiLabel = earthquake.tsunami ? ' · Tsunami alert' : '';
      const title = earthquake.tsunami ? 'Tsunami-related earthquake' : 'Significant earthquake';
      const body = `M ${formatMagnitude(earthquake.magnitude)} · ${earthquake.place}${tsunamiLabel}`;
      new Notification(title, { body, tag: earthquake.id });
    });
  }

  function markNotified(earthquakeIds: string[]): void {
    earthquakeIds.forEach((id) => notifiedIds.add(id));
  }

  return {
    permission,
    isSupported,
    enableNotifications,
    disableNotifications,
    notifyCriticalEarthquakes,
    markNotified,
  };
}
