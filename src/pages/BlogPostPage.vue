<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { getPostBySlug } from "../lib/blog";

const route = useRoute();

const post = computed(() => getPostBySlug(String(route.params.slug)));
</script>

<template>
  <div v-if="post" class="blog-post mx-auto w-full min-w-0 max-w-[52rem] px-0 sm:px-2">
    <nav class="mb-8" aria-label="Blog navigation">
      <RouterLink
        to="/blog"
        class="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] transition-colors hover:border-[var(--accent)]/60 hover:text-[var(--accent)]"
      >
        <span aria-hidden="true">←</span>
        Back to blog
      </RouterLink>
    </nav>
    <article>
    <header class="mb-12 border-b border-[var(--border)] pb-10">
      <p class="mb-3 text-xs uppercase tracking-wide text-[var(--muted)]">
        {{ post.category }} · {{ post.date }} · {{ post.readingTime }}
      </p>
      <h1 class="mb-5 break-words text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
        {{ post.title }}
      </h1>
      <p class="break-words text-base leading-relaxed text-[var(--muted)] sm:text-lg md:text-xl">{{ post.summary }}</p>
    </header>
    <div class="prose-content" v-html="post.content" />
    </article>
    <div class="mt-14 border-t border-[var(--border)] pt-10">
      <RouterLink
        to="/blog"
        class="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] transition-colors hover:border-[var(--accent)]/60 hover:text-[var(--accent)]"
      >
        <span aria-hidden="true">←</span>
        Back to blog
      </RouterLink>
    </div>
  </div>
  <div v-else class="mx-auto w-full min-w-0 max-w-[52rem] px-0 sm:px-2">
    <nav class="mb-6" aria-label="Blog navigation">
      <RouterLink
        to="/blog"
        class="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] transition-colors hover:border-[var(--accent)]/60 hover:text-[var(--accent)]"
      >
        <span aria-hidden="true">←</span>
        Back to blog
      </RouterLink>
    </nav>
    <p>Post not found.</p>
  </div>
</template>
