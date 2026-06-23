<template>
  <div class="min-h-screen bg-slate-100">
    <div class="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-8 2xl:max-w-[1440px]">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold text-slate-900">Earthquake Monitoring Dashboard</h1>
        <p class="text-sm text-slate-500">USGS live seismic activity</p>
      </header>
      <AppNavTabs />
      <MonitoringControls />
      <main class="pb-20 md:pb-6">
        <RouterView v-slot="{ Component, route }">
          <Transition name="tab-fade" mode="out-in" @after-enter="onRouteEntered">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppNavTabs from '@/components/AppNavTabs.vue';
import MonitoringControls from '@/components/MonitoringControls.vue';
import '@/assets/styles/dashboard.css';

function onRouteEntered(): void {
  window.dispatchEvent(new Event('resize'));
}
</script>
