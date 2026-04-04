<script setup lang="ts">
import { BookOpen, FolderKanban, Github, Home } from "lucide-vue-next";
import ThemeToggle from "./ThemeToggle.vue";
</script>

<template>
  <header
    class="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]/92 pt-[env(safe-area-inset-top,0px)] backdrop-blur"
  >
    <!-- Mobile: centered brand + toolbar (md+ hidden) -->
    <div
      class="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-2.5 px-4 py-3 md:hidden"
    >
      <RouterLink
        to="/"
        class="shrink-0 text-sm font-semibold tracking-tight text-[var(--text)]"
        style="font-family: 'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace;"
      >
        MaskedSyntax
      </RouterLink>

      <nav
        class="inline-flex max-w-full items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)]/95 px-1.5 py-1.5 shadow-sm backdrop-blur-sm"
        aria-label="Primary"
      >
        <!-- Segmented: Home, Projects, Blog -->
        <div
          class="flex items-center gap-0.5 rounded-lg bg-[var(--bg)]/80 p-1 ring-1 ring-[var(--border)]/50"
          role="tablist"
        >
          <RouterLink to="/" custom v-slot="{ href, navigate, isExactActive }">
            <a
              :href="href"
              role="tab"
              :aria-current="isExactActive ? 'page' : undefined"
              :aria-selected="isExactActive"
              class="inline-flex h-10 min-h-[44px] min-w-[44px] w-10 shrink-0 items-center justify-center rounded-md text-[var(--muted)] outline-none transition-[color,background-color,box-shadow] hover:bg-[var(--bg)]/80 hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] active:scale-[0.97]"
              :class="
                isExactActive
                  ? 'bg-[var(--card)] text-[var(--accent)] shadow-[inset_0_0_0_1.5px_var(--accent)]'
                  : ''
              "
              aria-label="Home"
              @click="(e: MouseEvent) => navigate(e)"
            >
              <Home :size="18" :stroke-width="2" class="shrink-0" />
            </a>
          </RouterLink>
          <RouterLink to="/projects" custom v-slot="{ href, navigate, isActive }">
            <a
              :href="href"
              role="tab"
              :aria-current="isActive ? 'page' : undefined"
              :aria-selected="isActive"
              class="inline-flex h-10 min-h-[44px] min-w-[44px] w-10 shrink-0 items-center justify-center rounded-md text-[var(--muted)] outline-none transition-[color,background-color,box-shadow] hover:bg-[var(--bg)]/80 hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] active:scale-[0.97]"
              :class="
                isActive
                  ? 'bg-[var(--card)] text-[var(--accent)] shadow-[inset_0_0_0_1.5px_var(--accent)]'
                  : ''
              "
              aria-label="Projects"
              @click="(e: MouseEvent) => navigate(e)"
            >
              <FolderKanban :size="18" :stroke-width="2" class="shrink-0" />
            </a>
          </RouterLink>
          <RouterLink to="/blog" custom v-slot="{ href, navigate, isActive }">
            <a
              :href="href"
              role="tab"
              :aria-current="isActive ? 'page' : undefined"
              :aria-selected="isActive"
              class="inline-flex h-10 min-h-[44px] min-w-[44px] w-10 shrink-0 items-center justify-center rounded-md text-[var(--muted)] outline-none transition-[color,background-color,box-shadow] hover:bg-[var(--bg)]/80 hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] active:scale-[0.97]"
              :class="
                isActive
                  ? 'bg-[var(--card)] text-[var(--accent)] shadow-[inset_0_0_0_1.5px_var(--accent)]'
                  : ''
              "
              aria-label="Blog"
              @click="(e: MouseEvent) => navigate(e)"
            >
              <BookOpen :size="18" :stroke-width="2" class="shrink-0" />
            </a>
          </RouterLink>
        </div>

        <div
          class="mx-0.5 h-9 w-px shrink-0 self-center bg-[var(--border)]"
          aria-hidden="true"
        />

        <a
          href="https://github.com/maskedsyntax"
          target="_blank"
          rel="noreferrer"
          class="inline-flex h-10 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--text)] active:scale-[0.97]"
          aria-label="GitHub profile (opens in new tab)"
          title="GitHub — opens in new tab"
        >
          <Github :size="18" :stroke-width="2" class="shrink-0" />
        </a>

        <ThemeToggle embedded-in-pill />
      </nav>
    </div>

    <!-- Tablet / desktop -->
    <div
      class="shell-frame mx-auto hidden w-full min-w-0 max-w-[1180px] items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 md:flex md:px-10"
    >
      <RouterLink
        to="/"
        class="min-w-0 shrink text-base font-semibold tracking-tight sm:text-xl md:text-2xl"
        style="font-family: 'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace;"
      >
        MaskedSyntax
      </RouterLink>

      <nav class="flex shrink-0 items-center gap-2 sm:gap-4 md:gap-5" aria-label="Primary">
        <RouterLink to="/projects" class="nav-link nav-link-desktop-only whitespace-nowrap">
          Projects
        </RouterLink>
        <RouterLink to="/blog" class="nav-link nav-link-desktop-only whitespace-nowrap">
          Blog
        </RouterLink>

        <a
          href="https://github.com/maskedsyntax"
          target="_blank"
          rel="noreferrer"
          class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--card)] text-[var(--text)] transition-colors hover:border-[var(--accent)]"
          aria-label="GitHub profile (opens in new tab)"
          title="GitHub — opens in new tab"
        >
          <Github :size="16" />
        </a>
        <ThemeToggle />
      </nav>
    </div>
  </header>
</template>
