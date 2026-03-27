<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import PostCard from "../components/PostCard.vue";
import SectionShell from "../components/SectionShell.vue";
import { getAllPosts } from "../lib/blog";

const PAGE_SIZE = 4;
const allPosts = getAllPosts();
const route = useRoute();
const router = useRouter();

const totalPages = computed(() => Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE)));
const currentPage = computed(() => {
  const fromQuery = Number(route.query.page ?? "1");
  if (Number.isNaN(fromQuery) || fromQuery < 1) return 1;
  return Math.min(fromQuery, totalPages.value);
});

const posts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return allPosts.slice(start, start + PAGE_SIZE);
});

function goToPage(page: number) {
  const next = Math.min(Math.max(page, 1), totalPages.value);
  router.push({ path: "/blog", query: next === 1 ? {} : { page: String(next) } });
}
</script>

<template>
  <SectionShell
    title="Blog"
    description="Long-form notes from building things: what I tried, what broke, and what stuck. Less paper, more lab notebook — lots of code and sketches along the way."
  >
    <div class="flex flex-col gap-4">
      <PostCard v-for="post in posts" :key="post.slug" :post="post" />
    </div>
    <div v-if="totalPages > 1" class="mt-6 flex items-center gap-3 text-sm">
      <button
        type="button"
        class="rounded-sm border border-[var(--border)] bg-[var(--card)] px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
      >
        Previous
      </button>
      <p class="text-[var(--muted)]">Page {{ currentPage }} of {{ totalPages }}</p>
      <button
        type="button"
        class="rounded-sm border border-[var(--border)] bg-[var(--card)] px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="currentPage >= totalPages"
        @click="goToPage(currentPage + 1)"
      >
        Next
      </button>
    </div>
  </SectionShell>
</template>
