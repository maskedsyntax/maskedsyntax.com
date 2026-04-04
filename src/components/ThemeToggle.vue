<script setup lang="ts">
import { Moon, Sun } from "lucide-vue-next";
import { computed } from "vue";
import { useSiteTheme } from "../composables/useSiteTheme";

withDefaults(
  defineProps<{
    /** Ghost icon inside mobile pill toolbar only. */
    embeddedInPill?: boolean;
  }>(),
  { embeddedInPill: false },
);

const { theme, toggleTheme } = useSiteTheme();
const label = computed(() => (theme.value === "dark" ? "Switch to light" : "Switch to dark"));
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :class="
      embeddedInPill
        ? 'inline-flex h-10 min-h-[44px] min-w-[44px] w-10 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-[var(--muted)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--text)] active:scale-[0.97]'
        : 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--text)] transition-colors hover:border-[var(--accent)]'
    "
    @click="toggleTheme"
  >
    <Sun v-if="theme === 'dark'" :size="16" />
    <Moon v-else :size="16" />
  </button>
</template>
