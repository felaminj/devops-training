import { onUnmounted, watch, type Ref } from 'vue';

export function useModalBodyScrollLock(isOpen: Ref<boolean>): void {
  watch(isOpen, (open) => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, { immediate: true });
  onUnmounted(() => {
    document.body.style.overflow = '';
  });
}
