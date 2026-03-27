<script setup lang="ts">
import SectionShell from "../components/SectionShell.vue";
</script>

<template>
  <SectionShell title="About">
    <article class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <p class="text-[var(--muted)]">
        The full About section is now on the Home page for a single-page portfolio flow.
      </p>
      <RouterLink class="mt-3 inline-block text-[var(--accent)] hover:underline" to="/">
        Go to Home
      </RouterLink>
    </article>
  </SectionShell>
</template>
