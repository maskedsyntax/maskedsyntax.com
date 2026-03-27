<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { getPostBySlug } from "../lib/blog";

const route = useRoute();

const post = computed(() => getPostBySlug(String(route.params.slug)));
</script>

<template>
  <article v-if="post" class="blog-post mx-auto w-full max-w-[52rem] px-1 sm:px-2">
    <header class="mb-12 border-b border-[var(--border)] pb-10">
      <p class="mb-3 text-xs uppercase tracking-wide text-[var(--muted)]">
        {{ post.category }} · {{ post.date }} · {{ post.readingTime }}
      </p>
      <h1 class="mb-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{{ post.title }}</h1>
      <p class="text-lg leading-relaxed text-[var(--muted)] sm:text-xl">{{ post.summary }}</p>
    </header>
    <div class="prose-content" v-html="post.content" />
  </article>
  <p v-else>Post not found.</p>
</template>
