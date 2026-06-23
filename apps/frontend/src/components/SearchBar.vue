<template>
  <label class="block w-full">
    <span class="mb-1.5 block text-sm font-medium text-slate-700">Search</span>
    <input
      :value="modelValue"
      type="search"
      placeholder="Search by location or event ID"
      class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
      @input="onInput"
    />
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}
</script>
