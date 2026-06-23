import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const THEME_KEY = 'earthquake-dashboard-theme';

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false);

  function applyTheme(): void {
    document.documentElement.classList.toggle('dark', isDark.value);
    localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light');
  }

  function initTheme(): void {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      isDark.value = saved === 'dark';
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();
  }

  function toggleTheme(): void {
    isDark.value = !isDark.value;
    applyTheme();
  }

  watch(isDark, applyTheme);

  return {
    isDark,
    initTheme,
    toggleTheme,
  };
});
