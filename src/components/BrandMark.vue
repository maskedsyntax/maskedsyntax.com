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
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    :aria-hidden="decorative ? 'true' : undefined"
    :role="decorative ? undefined : 'img'"
    aria-label="MaskedSyntax"
  >
    <path
      d="M18 20 68 49 54 57v53L18 89V20Z"
      fill="currentColor"
    />
    <path
      d="m47 51 63-33v46L78 82V65l-9-5v34L47 81V51Z"
      fill="var(--accent)"
    />
    <path d="m74 62 36 21v27H74V62Z" fill="currentColor" />
  </svg>
</template>
