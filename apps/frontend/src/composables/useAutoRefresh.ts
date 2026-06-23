import { onMounted, onUnmounted } from 'vue';
import { EARTHQUAKE_POLL_INTERVAL_MS } from '@/constants/polling';

export function useAutoRefresh(
  callback: () => void | Promise<void>,
  intervalMs = EARTHQUAKE_POLL_INTERVAL_MS
) {
  let timer: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    timer = setInterval(() => {
      void callback();
    }, intervalMs);
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });
}
