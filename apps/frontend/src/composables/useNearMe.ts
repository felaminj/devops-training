import { useMonitoringPreferencesStore } from '@/stores/monitoringPreferencesStore';

export function useNearMe() {
  const preferences = useMonitoringPreferencesStore();

  async function requestUserLocation(): Promise<void> {
    if (!navigator.geolocation) {
      preferences.setLocationError('Geolocation is not supported in this browser.');
      return;
    }
    preferences.clearLocationError();
    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          preferences.setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          preferences.nearMeEnabled = true;
          resolve();
        },
        (error) => {
          preferences.setLocationError(error.message || 'Unable to access your location.');
          resolve();
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  async function toggleNearMe(): Promise<void> {
    if (preferences.nearMeActive) {
      preferences.nearMeEnabled = false;
      return;
    }
    await requestUserLocation();
  }

  return {
    preferences,
    requestUserLocation,
    toggleNearMe,
  };
}
