<script setup lang="ts">
import SiteHeader from "./components/SiteHeader.vue";
</script>

<template>
  <div class="min-h-screen min-w-0 overflow-x-clip bg-[var(--bg)] text-[var(--text)]">
    <SiteHeader />
    <main
      class="shell-frame mx-auto w-full min-w-0 max-w-[1180px] px-4 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] pt-6 sm:px-6 sm:pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:pt-10 md:px-10"
    >
      <RouterView />
    </main>
  </div>
</template>
