<template>
  <div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
    <p class="text-sm font-medium text-slate-700">{{ title }}</p>
    <p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>
