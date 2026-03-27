<script setup lang="ts">
defineProps<{
  code: string;
  language?: string;
}>();
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-[var(--border)]">
    <div class="border-b border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs uppercase text-[var(--muted)]">
      {{ language ?? "text" }}
    </div>
    <pre class="m-0 overflow-x-auto bg-[#0f172a] p-4 text-sm text-slate-200"><code>{{ code }}</code></pre>
  </div>
</template>
