<script setup lang="ts">
import BrandMark from "../components/BrandMark.vue";
import { site } from "../data/site";
</script>

<template>
  <section class="home-hero">
    <div class="home-hero__backdrop" aria-hidden="true" />

    <div class="home-hero__frame">
      <article class="home-hero__panel">
        <div class="home-hero__chrome" aria-hidden="true">
          <span /><span /><span />
        </div>

        <div class="home-hero__body">
          <p class="home-hero__eyebrow">alias</p>
          <div class="home-hero__identity">
            <BrandMark class="home-hero__mark" :size="64" decorative />
            <h1 class="home-hero__title">{{ site.brand.wordmark }}</h1>
          </div>
          <div class="home-hero__rule" aria-hidden="true" />
          <p class="home-hero__tagline">
            <span class="home-hero__prompt" aria-hidden="true">›</span>
            {{ site.brand.tagline }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 100vh;
  min-height: 100dvh;
  margin-inline: -1rem;
  padding: 0 1rem 2rem;
  overflow: hidden;
}

@media (min-width: 640px) {
  .home-hero {
    margin-inline: -1.5rem;
    padding-inline: 1.5rem;
    padding-bottom: 3rem;
  }
}

@media (min-width: 768px) {
  .home-hero {
    margin-inline: -2.5rem;
    padding-inline: 2.5rem;
    padding-bottom: 4rem;
  }
}

.home-hero__backdrop {
  position: absolute;
  inset: -20% -10% 0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--border) 55%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--border) 55%, transparent) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse 85% 75% at 18% 82%, black 15%, transparent 72%);
  pointer-events: none;
}

.home-hero__frame {
  position: relative;
  z-index: 1;
  width: fit-content;
  max-width: 100%;
}

.home-hero__panel {
  width: fit-content;
  max-width: 100%;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--card) 92%, var(--bg));
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent),
    0 24px 48px -24px color-mix(in srgb, var(--text) 18%, transparent);
}

.home-hero__chrome {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 65%, var(--card));
}

.home-hero__chrome span {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--muted) 18%, var(--card));
}

.home-hero__chrome span:first-child {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--border));
  background: color-mix(in srgb, var(--accent) 22%, var(--card));
}

.home-hero__body {
  padding: 1.35rem 1.25rem 1.5rem;
}

@media (min-width: 640px) {
  .home-hero__body {
    padding: 1.65rem 1.5rem 1.85rem;
  }
}

.home-hero__eyebrow {
  margin: 0 0 0.65rem;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.home-hero__identity {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.home-hero__mark {
  flex: 0 0 auto;
  width: clamp(3rem, 9vw, 4rem);
  height: auto;
  color: var(--text);
}

.home-hero__title {
  margin: 0;
  font-family: "Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: clamp(1.85rem, 5vw, 2.65rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.home-hero__rule {
  width: 2.75rem;
  height: 2px;
  margin: 1.1rem 0 1rem;
  background: var(--accent);
}

.home-hero__tagline {
  margin: 0;
  font-size: clamp(0.8125rem, 2.5vw, 1.0625rem);
  line-height: 1.55;
  color: var(--muted);
  white-space: nowrap;
}

.home-hero__prompt {
  margin-right: 0.35rem;
  color: var(--accent);
  font-weight: 600;
}

@media (prefers-reduced-motion: no-preference) {
  .home-hero__panel {
    animation: home-panel-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .home-hero__tagline {
    animation: home-tagline-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both;
  }
}

@keyframes home-panel-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}

@keyframes home-tagline-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
</style>
