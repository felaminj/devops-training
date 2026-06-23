<template>
  <span
    v-if="active"
    class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"
    role="status"
    aria-live="polite"
  >
    <span
      class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"
      aria-hidden="true"
    />
    <span>{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  active: boolean;
  label?: string;
}>(), {
  label: 'Updating',
});
</script>
