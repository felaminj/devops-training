<template>
  <div class="shrink-0 rounded-lg p-2 sm:p-2.5" :class="toneClass">
    <Icon :icon="icon" class="h-5 w-5" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { MetricIconTone } from '@/constants/metricIconTones';
import { getMetricIconToneClass } from '@/constants/metricIconTones';

const props = defineProps<{
  icon: string;
  tone: MetricIconTone;
}>();

const toneClass = computed(() => getMetricIconToneClass(props.tone));
</script>
