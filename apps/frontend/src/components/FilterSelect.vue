<template>
  <label class="block w-full">
    <span class="mb-1.5 block text-sm font-medium text-slate-700">{{ label }}</span>
    <select
      :value="modelValue"
      class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
      @change="onChange"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  modelValue: string;
  options: Array<{ value: string; label: string }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function onChange(event: Event): void {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
}
</script>
