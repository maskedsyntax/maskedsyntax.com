<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
import ProjectCard from "../components/ProjectCard.vue";
import SectionShell from "../components/SectionShell.vue";
import { shippedWork } from "../data/ecosystem";
import { profile } from "../data/profile";
import { currentlyBuilding, featuredProjects } from "../data/projects";
</script>

<template>
  <section class="py-10">
    <article>
      <div class="mb-5 flex items-center gap-4">
        <img
          src="https://github.com/maskedsyntax.png?size=160"
          alt="Aftaab Siddiqui avatar"
          class="h-16 w-16 rounded-md border border-[var(--border)] object-cover"
          loading="lazy"
          referrerpolicy="no-referrer"
        />
        <div class="flex h-16 flex-col justify-center">
          <p
            class="text-3xl font-semibold leading-none sm:text-5xl"
            style="font-family: 'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace;"
          >
            MaskedSyntax
          </p>
          <p class="mt-1 text-sm leading-none text-[var(--muted)] sm:text-base">Aftaab Siddiqui</p>
        </div>
      </div>
      <p class="mb-5 text-sm text-[var(--muted)] sm:text-base">{{ profile.role }}</p>
      <p class="mb-4 max-w-4xl text-sm sm:text-base">
        I build local-first developer tools and research-heavy systems where implementation quality matters more than trend chasing.
      </p>
      <p class="max-w-4xl text-sm text-[var(--muted)] sm:text-base">
        Current focus: search infrastructure, high-performance tooling, and practical ML workflows that close the gap between papers and production.
      </p>
      <div class="mt-8 flex flex-wrap gap-3 text-sm">
        <a class="rounded-sm border border-[var(--border)] bg-[var(--card)] px-4 py-2 hover:border-[var(--accent)]" :href="profile.links.github" target="_blank" rel="noreferrer">GitHub</a>
        <a class="rounded-sm border border-[var(--border)] bg-[var(--card)] px-4 py-2 hover:border-[var(--accent)]" :href="profile.links.cachevector" target="_blank" rel="noreferrer">CacheVector</a>
        <RouterLink class="rounded-sm border border-[var(--border)] bg-[var(--card)] px-4 py-2 hover:border-[var(--accent)]" to="/blog">Blog</RouterLink>
      </div>
    </article>

  </section>

  <SectionShell title="Featured Projects" description="Six highlighted projects across tooling, systems, and ML work.">
    <div class="grid gap-4 md:grid-cols-2">
      <ProjectCard v-for="project in featuredProjects" :key="project.slug" :project="project" />
    </div>
  </SectionShell>

  <SectionShell v-if="currentlyBuilding" title="Currently Building">
    <article class="rounded-sm border border-[var(--border)] bg-[var(--card)] p-5">
      <p class="mb-2 text-xs uppercase tracking-wide text-[var(--muted)]">Now</p>
      <h3 class="mb-2 text-xl font-semibold">{{ currentlyBuilding.name }}</h3>
      <p class="mb-2 text-sm text-[var(--muted)]">{{ currentlyBuilding.tagline }}</p>
      <p class="text-[var(--muted)]">{{ currentlyBuilding.description }}</p>
      <a v-if="currentlyBuilding.repoUrl" :href="currentlyBuilding.repoUrl" target="_blank" rel="noreferrer" class="mt-4 inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline">
        Follow progress
        <ArrowRight :size="14" />
      </a>
    </article>
  </SectionShell>

  <SectionShell title="Shipped Work">
    <div class="grid gap-3 md:grid-cols-2">
      <article
        v-for="item in shippedWork"
        :key="item.name"
        class="rounded-sm border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--accent)]"
      >
        <h3 class="mb-1 text-base font-semibold">{{ item.name }}</h3>
        <p class="mb-3 text-sm text-[var(--muted)]">{{ item.description }}</p>
        <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <a
            :href="item.websiteUrl"
            target="_blank"
            rel="noreferrer"
            class="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
          >
            {{ item.websiteLabel }}
            <span aria-hidden="true">↗</span>
          </a>
          <a
            :href="item.githubUrl"
            target="_blank"
            rel="noreferrer"
            class="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
          >
            GitHub
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </article>
    </div>
  </SectionShell>
</template>
