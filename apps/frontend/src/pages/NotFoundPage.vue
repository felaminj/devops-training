<template>
  <section :class="SURFACE_CARD_CLASS" class="p-12 text-center shadow-sm">
    <h1 class="text-2xl font-semibold text-slate-900">404</h1>
    <p class="mt-2 text-sm text-slate-500">Page not found</p>
    <RouterLink
      to="/"
      class="mt-6 inline-flex min-h-9 items-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
    >
      Go to Dashboard
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';
</script>
