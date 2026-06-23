<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    class="h-3 w-3 shrink-0"
    aria-hidden="true"
  >
    <path
      d="M3 21 L10 8 L14 14 L18 6 L21 21 Z"
      :fill="color"
      stroke="#ffffff"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <path d="M10 8 L14 14 L12 14 Z" fill="#ffffff" fill-opacity="0.35" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  color: string;
}>();
</script>
