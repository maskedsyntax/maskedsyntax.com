<script setup lang="ts">
import type { Project } from "../types";

defineProps<{ project: Project }>();
</script>

<template>
  <article class="rounded-sm border border-[var(--border)] bg-[var(--card)] p-5">
    <h3 class="mb-1 text-lg font-semibold">{{ project.name }}</h3>
    <p class="mb-3 text-sm text-[var(--muted)]">{{ project.tagline }}</p>
    <p class="mb-4 text-sm">{{ project.description }}</p>
    <ul class="mb-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
      <li v-for="tag in project.tags" :key="`${project.slug}-${tag}`" class="rounded-sm border border-[var(--border)] px-2 py-1">
        {{ tag }}
      </li>
    </ul>
    <div class="flex items-center gap-4 text-sm">
      <a
        v-if="project.repoUrl"
        :href="project.repoUrl"
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
        title="Opens in a new tab"
      >
        View Project <span aria-hidden="true">↗</span>
      </a>
      <a v-if="project.liveUrl" :href="project.liveUrl" target="_blank" rel="noreferrer" class="text-[var(--accent)] hover:underline">
        Live
      </a>
    </div>
  </article>
</template>
