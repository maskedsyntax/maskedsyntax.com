<script setup lang="ts">
import type { BlogPostMeta } from "../types";

defineProps<{ post: BlogPostMeta }>();
</script>

<template>
  <article
    class="rounded-sm border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 transition-colors hover:border-[var(--accent)]/70"
  >
    <p class="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--muted)]">
      {{ post.category }} · {{ post.date }} · {{ post.readingTime }}
    </p>
    <h3 class="mb-2 text-lg font-semibold leading-snug sm:text-xl">
      <RouterLink :to="`/blog/${post.slug}`" class="hover:text-[var(--accent)]">
        {{ post.title }}
      </RouterLink>
    </h3>
    <p class="post-card-summary text-sm leading-relaxed text-[var(--muted)]">{{ post.summary }}</p>
    <ul class="mt-3 flex flex-wrap gap-1.5 text-[11px] text-[var(--muted)]">
      <li v-for="tag in post.tags" :key="`${post.slug}-${tag}`" class="rounded-sm border border-[var(--border)] px-2 py-0.5">
        {{ tag }}
      </li>
    </ul>
  </article>
</template>
