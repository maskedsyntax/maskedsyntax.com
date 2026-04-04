<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { profile } from "../data/profile";

type GitHubRepo = {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number | null;
  forks_count: number | null;
  language: string | null;
  pushed_at: string;
};

const username = "maskedsyntax";
const loading = ref(true);
const error = ref<string | null>(null);
const pinnedRepos = ref<GitHubRepo[]>([]);

const weekdayLabels = ["Mon", "Wed", "Fri"];

const heatmapGrid = computed(() => {
  const days: { key: string; count: number; date: Date }[] = [];
  const today = new Date();
  const counts = new Map<string, number>();
  const entries = commitEntries.value;
  for (const entry of entries) counts.set(entry.key, entry.count);

  for (let i = 90; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    days.push({ key, count: counts.get(key) ?? 0, date });
  }

  const first = new Date(days[0]?.date ?? today);
  const firstWeekday = (first.getDay() + 6) % 7; // Monday = 0
  const padded: ({ key: string; count: number; date: Date } | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...days,
  ];

  const weeks: ({ key: string; count: number; date: Date } | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    const column = padded.slice(i, i + 7);
    while (column.length < 7) column.push(null);
    weeks.push(column);
  }

  const monthMarkers = weeks.map((week, index) => {
    const firstDay = week.find((d) => d !== null);
    if (!firstDay) return "";
    const month = firstDay.date.toLocaleString("en-US", { month: "short" });
    const previousWeek = weeks[index - 1];
    const previousDay = previousWeek?.find((d) => d !== null);
    const previousMonth = previousDay?.date.toLocaleString("en-US", { month: "short" });
    return month !== previousMonth ? month : "";
  });

  return { weeks, monthMarkers };
});

const commitEntries = ref<{ key: string; count: number }[]>([]);

function heatColor(count: number) {
  if (count === 0) return "#2b2b2d";
  if (count <= 2) return "#3730a3";
  if (count <= 5) return "#4f46e5";
  if (count <= 9) return "#6366f1";
  return "#818cf8";
}

async function fetchAllCommitsForRepo(repo: string, sinceIso: string) {
  const commitDates: string[] = [];
  let page = 1;

  while (page <= 3) {
    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/commits?author=${username}&since=${sinceIso}&per_page=100&page=${page}`,
    );
    if (!res.ok) break;
    const data = (await res.json()) as Array<{ commit?: { author?: { date?: string } } }>;
    if (!Array.isArray(data) || data.length === 0) break;

    for (const commit of data) {
      const date = commit.commit?.author?.date?.slice(0, 10);
      if (date) commitDates.push(date);
    }

    if (data.length < 100) break;
    page += 1;
  }

  return commitDates;
}

onMounted(async () => {
  try {
    const pinnedResults = await Promise.allSettled(
      profile.pinnedRepos.map(async (repo) => {
        const res = await fetch(`https://api.github.com/repos/${username}/${repo}`);
        if (!res.ok) {
          return {
            name: repo,
            html_url: `https://github.com/${username}/${repo}`,
            description: null,
            stargazers_count: null,
            forks_count: null,
            language: null,
            pushed_at: "",
          } satisfies GitHubRepo;
        }
        const apiRepo = (await res.json()) as GitHubRepo;
        return {
          ...apiRepo,
          stargazers_count: typeof apiRepo.stargazers_count === "number" ? apiRepo.stargazers_count : null,
          forks_count: typeof apiRepo.forks_count === "number" ? apiRepo.forks_count : null,
        } satisfies GitHubRepo;
      }),
    );
    pinnedRepos.value = pinnedResults.map((result, index) => {
      if (result.status === "fulfilled") return result.value;
      const repo = profile.pinnedRepos[index] ?? `repo-${index + 1}`;
      return {
        name: repo,
        html_url: `https://github.com/${username}/${repo}`,
        description: null,
        stargazers_count: null,
        forks_count: null,
        language: null,
        pushed_at: "",
      } satisfies GitHubRepo;
    });

    const since = new Date();
    since.setDate(since.getDate() - 365);
    const sinceIso = since.toISOString();

    const commitDatesByRepo = await Promise.all(
      profile.pinnedRepos.map((repo) => fetchAllCommitsForRepo(repo, sinceIso)),
    );
    const counts = new Map<string, number>();
    for (const dates of commitDatesByRepo) {
      for (const date of dates) counts.set(date, (counts.get(date) ?? 0) + 1);
    }
    commitEntries.value = [...counts.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => (a.key < b.key ? -1 : 1));
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Could not load GitHub widgets";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="mt-4 grid gap-4">
    <div v-if="loading" class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
      Loading GitHub widgets...
    </div>
    <div v-else-if="error" class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
      {{ error }}. GitHub widgets could not be loaded right now.
    </div>
    <template v-else>
      <section class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h4 class="mb-3 text-base font-semibold">Contribution Heatmap (Last 365 days)</h4>
        <div class="overflow-x-auto">
          <div class="inline-block min-w-[900px]">
            <div class="mb-1 grid grid-flow-col auto-cols-[12px] gap-1 pl-10 text-[10px] text-[var(--muted)]">
              <span v-for="(month, idx) in heatmapGrid.monthMarkers" :key="`month-${idx}`" class="h-3">
                {{ month }}
              </span>
            </div>
            <div class="flex gap-2">
              <div class="grid grid-rows-7 gap-1 pt-[2px] text-[10px] text-[var(--muted)]">
                <span class="h-3"></span>
                <span class="h-3">{{ weekdayLabels[0] }}</span>
                <span class="h-3"></span>
                <span class="h-3">{{ weekdayLabels[1] }}</span>
                <span class="h-3"></span>
                <span class="h-3">{{ weekdayLabels[2] }}</span>
                <span class="h-3"></span>
              </div>
              <div class="grid grid-flow-col auto-cols-[12px] gap-1">
                <div v-for="(week, weekIndex) in heatmapGrid.weeks" :key="`week-${weekIndex}`" class="grid grid-rows-7 gap-1">
                  <div
                    v-for="(day, dayIndex) in week"
                    :key="day ? day.key : `empty-${weekIndex}-${dayIndex}`"
                    class="h-3 w-3 rounded-[2px]"
                    :style="{ backgroundColor: day ? heatColor(day.count) : 'transparent' }"
                    :title="day ? `${day.key}: ${day.count} events` : ''"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <p class="mt-3 text-xs text-[var(--muted)]">
          Commit counts are aggregated from your pinned repositories over the last 365 days.
        </p>
      </section>

      <section class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h4 class="mb-3 text-base font-semibold">Pinned Repositories</h4>
        <ul class="grid gap-2">
          <li v-for="repo in pinnedRepos" :key="repo.name" class="rounded border border-[var(--border)] p-3 text-sm">
            <a :href="repo.html_url" target="_blank" rel="noreferrer" class="font-semibold hover:text-[var(--accent)]">
              {{ repo.name }}
            </a>
            <p v-if="repo.description" class="mt-1 text-xs text-[var(--muted)]">
              {{ repo.description }}
            </p>
            <p class="mt-1 text-xs text-[var(--muted)]">
              ★ {{ repo.stargazers_count ?? "n/a" }} · Forks {{ repo.forks_count ?? "n/a" }} · {{ repo.language ?? "Unknown" }}
            </p>
          </li>
        </ul>
        <p v-if="pinnedRepos.length === 0" class="text-sm text-[var(--muted)]">
          No pinned repositories configured.
        </p>
      </section>
    </template>
  </div>
</template>
