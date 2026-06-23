export const NEAR_ME_RADIUS_OPTIONS = [
  { value: 100, label: '100 km' },
  { value: 250, label: '250 km' },
  { value: 500, label: '500 km' },
  { value: 1000, label: '1000 km' },
] as const;

export const DEFAULT_NEAR_ME_RADIUS_KM = 500;

export const SOUND_ALERT_MAGNITUDE_OPTIONS = [
  { value: 2, label: 'M 2.0+' },
  { value: 3, label: 'M 3.0+' },
  { value: 4, label: 'M 4.0+' },
  { value: 5, label: 'M 5.0+' },
  { value: 6, label: 'M 6.0+' },
  { value: 7, label: 'M 7.0+' },
] as const;

export const DEFAULT_SOUND_ALERT_MIN_MAGNITUDE = 5;
