<script setup lang="ts">
import SectionShell from "../components/SectionShell.vue";
import SocialLinks from "../components/SocialLinks.vue";
import { profile } from "../data/profile";
</script>

<template>
  <SectionShell title="About">
    <article class="max-w-3xl">
      <div class="mb-5 flex items-center gap-3 sm:gap-4">
        <img
          src="https://github.com/maskedsyntax.png?size=160"
          alt="Aftaab Siddiqui avatar"
          class="h-14 w-14 shrink-0 rounded-md border border-[var(--border)] object-cover sm:h-16 sm:w-16"
          loading="lazy"
          referrerpolicy="no-referrer"
        />
        <div class="flex min-w-0 flex-col justify-center">
          <p
            class="break-words text-2xl font-semibold leading-tight sm:text-3xl"
            style="font-family: 'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace;"
          >
            {{ profile.name }}
          </p>
          <p class="mt-1 text-sm leading-none text-[var(--muted)] sm:text-base">{{ profile.handle }}</p>
        </div>
      </div>

      <p class="mb-5 break-words text-sm text-[var(--muted)] sm:text-base">{{ profile.role }}</p>
      <p class="mb-4 max-w-3xl break-words text-sm sm:text-base">{{ profile.homeIntro }}</p>
      <p class="max-w-3xl break-words text-sm text-[var(--muted)] sm:text-base">{{ profile.homeFocus }}</p>
      <p
        class="mt-5 max-w-3xl break-words border-l-2 border-[var(--accent)]/40 pl-3 text-sm leading-relaxed text-[var(--muted)] sm:pl-4 sm:text-base"
      >
        {{ profile.homeTwoSitesNote }}
        <a
          :href="profile.links.website"
          target="_blank"
          rel="noreferrer"
          class="font-medium text-[var(--accent)] hover:underline"
        >aftaab.dev</a>.
      </p>

      <div class="mt-6">
        <SocialLinks />
      </div>
    </article>
  </SectionShell>
</template>
