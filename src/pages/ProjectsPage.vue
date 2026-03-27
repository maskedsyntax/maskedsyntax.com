<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
import ProjectCard from "../components/ProjectCard.vue";
import SectionShell from "../components/SectionShell.vue";
import { projectsForProjectsPage } from "../data/projects";
</script>

<template>
  <SectionShell
    title="Projects"
    description="More work beyond the homepage highlights — systems, tools, and experiments that did not fit the featured grid."
  >
    <div class="grid gap-4 md:grid-cols-2">
      <ProjectCard v-for="project in projectsForProjectsPage" :key="project.slug" :project="project" />
    </div>
    <div class="mt-6">
      <a
        href="https://github.com/maskedsyntax?tab=repositories"
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm hover:border-[var(--accent)]"
      >
        See more on GitHub
        <ArrowRight :size="16" aria-hidden="true" />
      </a>
    </div>
  </SectionShell>
</template>
