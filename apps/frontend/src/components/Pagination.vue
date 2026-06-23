<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <p class="text-sm text-slate-500">
      Page {{ pagination.page }} of {{ pagination.totalPages }} ({{ pagination.totalItems }} items)
    </p>
    <div class="flex gap-2">
      <button
        type="button"
        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        :disabled="!pagination.hasPreviousPage"
        @click="$emit('page-change', pagination.page - 1)"
      >
        Previous
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        :disabled="!pagination.hasNextPage"
        @click="$emit('page-change', pagination.page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pagination } from '@earthquake/shared-types';

defineProps<{
  pagination: Pagination;
}>();

defineEmits<{
  'page-change': [page: number];
}>();
</script>
