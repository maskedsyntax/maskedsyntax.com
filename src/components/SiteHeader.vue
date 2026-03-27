<script setup lang="ts">
import { Github } from "lucide-vue-next";
import ThemeToggle from "./ThemeToggle.vue";
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]/92 backdrop-blur">
    <div class="shell-frame mx-auto flex w-full max-w-[1180px] items-center justify-between px-6 py-4 sm:px-10">
      <RouterLink
        to="/"
        class="text-xl font-semibold tracking-tight sm:text-2xl"
        style="font-family: 'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace;"
      >
        MaskedSyntax
      </RouterLink>

      <div class="flex items-center gap-4 sm:gap-5">
        <nav class="flex items-center gap-5 text-sm" aria-label="Primary">
          <RouterLink to="/projects" class="nav-link">Projects</RouterLink>
          <RouterLink to="/blog" class="nav-link">Blog</RouterLink>
        </nav>
        <div class="flex items-center gap-2">
          <a
            href="https://github.com/maskedsyntax"
            target="_blank"
            rel="noreferrer"
            class="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]"
            aria-label="GitHub profile"
          >
            <Github :size="16" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </div>
  </header>
</template>
