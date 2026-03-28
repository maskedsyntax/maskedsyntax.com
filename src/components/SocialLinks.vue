<script setup lang="ts">
import { Linkedin } from "lucide-vue-next";
import { siGithub, siPeerlist, siThreads, siX } from "simple-icons";

import { profile } from "../data/profile";

const brandPaths = {
  x: siX.path,
  threads: siThreads.path,
  peerlist: siPeerlist.path,
  github: siGithub.path,
} as const;
</script>

<template>
  <div class="mt-8 flex flex-wrap items-center gap-2">
    <a
      v-for="link in profile.socialLinks"
      :key="link.href"
      :href="link.href"
      target="_blank"
      rel="noreferrer noopener"
      class="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--card)] text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      :aria-label="link.label"
    >
      <Linkedin v-if="link.icon === 'linkedin'" :size="20" stroke-width="1.75" aria-hidden="true" />
      <svg v-else viewBox="0 0 24 24" class="h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
        <path :d="brandPaths[link.icon]" />
      </svg>
    </a>
  </div>
</template>
