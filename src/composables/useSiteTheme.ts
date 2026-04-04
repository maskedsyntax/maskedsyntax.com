import { ref } from "vue";

export type SiteTheme = "light" | "dark";

const theme = ref<SiteTheme>("light");
let hydrated = false;

function applyTheme(next: SiteTheme) {
  theme.value = next;
  document.documentElement.dataset.theme = next;
  localStorage.setItem("maskedsyntax-theme", next);
}

function toggleTheme() {
  applyTheme(theme.value === "dark" ? "light" : "dark");
}

function hydrateIfNeeded() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const saved = localStorage.getItem("maskedsyntax-theme") as SiteTheme | null;
  if (saved === "light" || saved === "dark") {
    applyTheme(saved);
    return;
  }
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(systemPrefersDark ? "dark" : "light");
}

export function useSiteTheme() {
  hydrateIfNeeded();
  return { theme, applyTheme, toggleTheme };
}
