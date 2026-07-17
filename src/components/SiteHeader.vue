<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import ThemeToggle from "./ThemeToggle.vue";
import { site } from "../data/site";

const route = useRoute();
const isHome = computed(() => route.path === "/");
</script>

<template>
  <header
    class="site-header"
    :class="{ 'site-header--home': isHome }"
  >
    <div class="site-header__inner shell-frame">
      <RouterLink to="/" class="site-header__brand">
        <span class="site-header__prompt" aria-hidden="true">~</span>
        <span class="site-header__brand-text">
          {{ isHome ? site.brand.domain : site.brand.wordmark }}
        </span>
      </RouterLink>

      <nav class="site-header__nav" aria-label="Primary">
        <RouterLink to="/blog" class="site-header__link">notes</RouterLink>
        <RouterLink to="/about" class="site-header__link">about</RouterLink>
        <a
          :href="site.brand.githubUrl"
          target="_blank"
          rel="noreferrer"
          class="site-header__link site-header__link--external"
        >
          github
        </a>
        <div class="site-header__theme">
          <ThemeToggle minimal />
        </div>
      </nav>
    </div>
  </header>
</template>
