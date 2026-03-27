<script setup lang="ts">
import { Moon, Sun } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";

const theme = ref<"light" | "dark">("light");
const label = computed(() => (theme.value === "dark" ? "Switch to light" : "Switch to dark"));

function applyTheme(nextTheme: "light" | "dark") {
  theme.value = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("maskedsyntax-theme", nextTheme);
}

function toggleTheme() {
  applyTheme(theme.value === "dark" ? "light" : "dark");
}

onMounted(() => {
  const saved = localStorage.getItem("maskedsyntax-theme") as "light" | "dark" | null;
  if (saved) {
    applyTheme(saved);
    return;
  }
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(systemPrefersDark ? "dark" : "light");
});
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--text)] transition-colors hover:border-[var(--accent)]"
    @click="toggleTheme"
  >
    <Sun v-if="theme === 'dark'" :size="16" />
    <Moon v-else :size="16" />
  </button>
</template>
