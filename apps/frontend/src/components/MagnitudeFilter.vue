<template>
  <label class="block w-full">
    <span class="mb-1.5 block text-sm font-medium text-slate-700">
      Min Magnitude: {{ modelValue.toFixed(1) }}
    </span>
    <input
      :value="modelValue"
      type="range"
      min="0"
      max="10"
      step="0.1"
      class="w-full accent-blue-600"
      @input="onInput"
    />
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', Number(target.value));
}
</script>
