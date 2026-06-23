<template>
  <div :class="SURFACE_CARD_CLASS" class="overflow-hidden shadow-sm">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Magnitude
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Location
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Time
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Depth
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Action
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          <tr v-for="earthquake in earthquakes" :key="earthquake.id" class="hover:bg-slate-50">
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-1 text-xs font-semibold text-white"
                :style="{ backgroundColor: getMagnitudeHexColor(earthquake.magnitude) }"
              >
                {{ formatMagnitude(earthquake.magnitude) }}
              </span>
            </td>
            <td class="px-4 py-3 font-medium text-slate-900">{{ earthquake.place }}</td>
            <td class="px-4 py-3 text-slate-600">{{ formatTimestamp(earthquake.time) }}</td>
            <td class="px-4 py-3 text-slate-600">{{ formatDepth(earthquake.depth) }}</td>
            <td class="px-4 py-3">
              <RouterLink
                :to="{ name: 'earthquake-details', params: { id: earthquake.id } }"
                class="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Details
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Earthquake } from '@earthquake/shared-types';
import {
  formatDepth,
  formatMagnitude,
  formatTimestamp,
  getMagnitudeHexColor,
} from '@earthquake/shared-utils';
import { SURFACE_CARD_CLASS } from '@/constants/surfaceStyles';

defineProps<{
  earthquakes: Earthquake[];
}>();
</script>
