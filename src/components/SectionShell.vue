<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <section class="mb-0 border-t border-[var(--border)] py-10">
    <header class="mb-5">
      <h2 class="mb-2 text-xl font-semibold sm:text-2xl">{{ title }}</h2>
      <p v-if="description" class="max-w-3xl text-sm text-[var(--muted)]">
        {{ description }}
      </p>
    </header>
    <slot />
  </section>
</template>
