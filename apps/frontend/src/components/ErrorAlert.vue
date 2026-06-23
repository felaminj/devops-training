<template>
  <div
    class="rounded-xl border border-red-200 bg-red-50 px-7 py-5 text-red-800"
    role="alert"
  >
    <div class="flex items-start justify-between gap-4">
      <p class="text-sm font-medium">{{ message }}</p>
      <button
        v-if="dismissible"
        type="button"
        class="text-sm font-semibold underline"
        @click="$emit('dismiss')"
      >
        Dismiss
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string;
  dismissible?: boolean;
}>();

defineEmits<{
  dismiss: [];
}>();
</script>
