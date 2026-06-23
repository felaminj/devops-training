export type MagnitudeColor = 'green' | 'yellow' | 'orange' | 'red' | 'gray';

export function getMagnitudeColor(magnitude: number | null): MagnitudeColor {
  if (magnitude === null || Number.isNaN(magnitude)) return 'gray';
  if (magnitude < 3) return 'green';
  if (magnitude < 5) return 'yellow';
  if (magnitude < 7) return 'orange';
  return 'red';
}

export function getMagnitudeHexColor(magnitude: number | null): string {
  const color = getMagnitudeColor(magnitude);
  const colorMap: Record<MagnitudeColor, string> = {
    green: '#22c55e',
    yellow: '#eab308',
    orange: '#f97316',
    red: '#ef4444',
    gray: '#94a3b8',
  };
  return colorMap[color];
}

export function formatMagnitude(magnitude: number | null): string {
  if (magnitude === null || Number.isNaN(magnitude)) return 'N/A';
  return magnitude.toFixed(1);
}

export function isSignificantMagnitude(magnitude: number | null, threshold = 5): boolean {
  if (magnitude === null) return false;
  return magnitude >= threshold;
}
