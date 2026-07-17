<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import SiteFooter from "./components/SiteFooter.vue";
import SiteHeader from "./components/SiteHeader.vue";

const route = useRoute();
const isHome = computed(() => route.path === "/");
</script>

<template>
  <div class="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-[var(--bg)] text-[var(--text)]">
    <SiteHeader />
    <main
      class="shell-frame mx-auto flex w-full min-w-0 max-w-[1180px] flex-1 flex-col px-4 sm:px-6 md:px-10"
      :class="
        isHome
          ? 'min-h-screen pt-0'
          : 'pt-6 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:pt-10 sm:pb-[calc(5rem+env(safe-area-inset-bottom,0px))]'
      "
    >
      <RouterView />
    </main>
    <SiteFooter v-if="!isHome" />
  </div>
</template>
