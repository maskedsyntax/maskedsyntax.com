<script setup lang="ts">
import SiteHeader from "./components/SiteHeader.vue";
</script>

<template>
  <div class="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <SiteHeader />
    <main class="shell-frame mx-auto w-full max-w-[1180px] px-6 pb-20 pt-10 sm:px-10">
      <RouterView />
    </main>
  </div>
</template>
