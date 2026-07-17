<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string;
    decorative?: boolean;
  }>(),
  {
    size: 24,
    decorative: false,
  },
);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :aria-hidden="decorative ? 'true' : undefined"
    :role="decorative ? undefined : 'img'"
    aria-label="MaskedSyntax"
  >
    <path
      d="M 12 48 V 10 H 44 L 48 16 V 28 L 12 48 Z"
      stroke="currentColor"
      stroke-width="3"
      stroke-linejoin="miter"
      stroke-linecap="square"
    />
    <path
      d="M 50 64 V 50 L 68 56 V 70 L 50 64 Z"
      stroke="currentColor"
      stroke-width="3"
      stroke-linejoin="miter"
      stroke-linecap="square"
    />
  </svg>
</template>
