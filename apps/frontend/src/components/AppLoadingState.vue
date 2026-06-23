<template>
  <div :class="SURFACE_CARD_CLASS" class="p-12 shadow-sm">
    <div class="flex flex-col items-center justify-center gap-4">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      <p class="text-base text-slate-500">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';

withDefaults(
  defineProps<{
    message?: string;
  }>(),
  {
    message: 'Loading earthquake data...',
  }
);
</script>
