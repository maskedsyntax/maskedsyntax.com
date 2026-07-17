<script setup lang="ts">
import { site } from "../data/site";
</script>

<template>
  <footer
    class="border-t border-[var(--border)] bg-[var(--bg)] pb-[env(safe-area-inset-bottom,0px)]"
  >
    <div
      class="shell-frame mx-auto flex w-full min-w-0 max-w-[1180px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-10"
    >
      <p class="max-w-xl text-sm text-[var(--muted)]">{{ site.brand.footerLine }}</p>
      <nav class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" aria-label="Footer">
        <a
          :href="site.brand.githubUrl"
          target="_blank"
          rel="noreferrer"
          class="text-[var(--accent)] hover:underline"
        >
          GitHub
        </a>
        <RouterLink to="/about" class="text-[var(--accent)] hover:underline">
          About the builder
        </RouterLink>
        <RouterLink to="/blog" class="text-[var(--accent)] hover:underline">
          Build notes
        </RouterLink>
      </nav>
    </div>
  </footer>
</template>
