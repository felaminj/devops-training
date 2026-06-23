export type MetricIconTone = 'blue' | 'indigo' | 'purple' | 'emerald' | 'amber' | 'rose' | 'cyan';

export const METRIC_ICON_TONE_CLASSES: Record<MetricIconTone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  purple: 'bg-purple-50 text-purple-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  cyan: 'bg-cyan-50 text-cyan-600',
};

export function getMetricIconToneClass(tone: MetricIconTone): string {
  return METRIC_ICON_TONE_CLASSES[tone];
}
