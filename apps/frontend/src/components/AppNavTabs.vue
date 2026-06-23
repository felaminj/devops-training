<template>
  <nav
    :class="SURFACE_NAV_CLASS"
    class="flex w-full min-w-0 items-center gap-2 overflow-x-auto scrollbar-hide"
    aria-label="Dashboard sections"
  >
    <RouterLink
      v-for="item in DASHBOARD_NAV_ITEMS"
      :key="item.id"
      :to="{ name: item.routeName }"
      class="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
      :class="isActive(item.routeName) ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700'"
    >
      <Icon :icon="item.icon" class="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useRoute } from 'vue-router';
import { DASHBOARD_NAV_ITEMS } from '@/constants/dashboardNav';
import { SURFACE_NAV_CLASS } from '@/constants/surfaceStyles';

const route = useRoute();

function isActive(routeName: string): boolean {
  return route.name === routeName;
}
</script>
