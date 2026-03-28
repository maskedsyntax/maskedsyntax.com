---
title: "RepoGrep and the No-Index Search Bet"
date: "2026-03-21"
tags: ["systems", "rust", "search", "local-first"]
summary: "I got tired of waiting for indexes to warm up. So I leaned on the one cache that already exists: the OS page cache."
reading_time: "6 min"
---

![RepoGrep Architecture](/images/blog/repogrep-architecture.svg)

Most code search tools want a background daemon, a database, or at least a `.git/index`-style artifact you maintain. I did not want another thing to babysit. I wanted: add a folder, hit enter, see matches. If that sounds naive, good. This whole experiment is about **trading away purity for immediacy**.

## What I was actually optimizing for

Not "fastest possible grep on a cold disk." That is a different product. I cared about no stale index after refactors or branch switches, no telemetry (your code stays on disk), and enough context that a hit is actionable. So I asked: what if there is **no index**, only parallel traversal plus string or regex matching, and we let the kernel cache do the rest?

## The walk layer and the cache bet

The Tauri backend builds a `GlobSet` from caller-supplied ignore patterns, then walks each root with `walkdir`. `filter_entry` drops dot-directories under the root, applies ignore globs to relative paths and basenames, and only keeps files that look like source via `is_code_file` (extension allowlist plus a few special names like `Dockerfile`).

```rust
let walker = WalkDir::new(&root_abs)
    .follow_links(false)
    .into_iter()
    .filter_entry(|e| {
        if e.depth() == 0 {
            return true;
        }
        let p = e.path();
        let rel_path_buf = p.strip_prefix(&root_abs).unwrap_or(p);
        let rel_path = normalize_path(rel_path_buf);
        let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");

        if ignore_set.is_match(&rel_path) || ignore_set.is_match(name) {
            return false;
        }

        if p.is_dir() {
            !name.starts_with('.')
        } else {
            is_code_file(p)
        }
    });
```

On a warm machine, a lot of those reads never touch the platter. They are satisfied from **page cache**, which is as close to an index as you get for free.

```text
  COLD (first run after reboot)
  disk ──read──► page cache ──► scan  (slow)

  WARM (normal dev day)
  page cache ──► scan  (mostly fast)
```

The bet is that **developers run the same searches often enough** that cache heat dominates. Where it hurts: huge trees on network filesystems (weird cache), first scan after clone (unavoidable), regex on massive minified files (you still pay bytes). That is a product boundary, not a moral failure. Treat the OS cache as a **hint**, not a contract.

## Measured shape

![Scan Cost Comparison](/images/blog/repogrep-latency.svg)

I am not claiming magic constants. Different disks tell different stories. The chart is about **shape**: warm cache queries land in a band that feels interactive.

## Parallel matching and the UI contract

After the walk produces a `Vec<FileCandidate>`, the expensive part is reading each file and scanning lines. That step is a **`par_iter().filter_map`**: `read_to_string`, count matches per line, build a `MatchResult`, or return `None` if nothing hit. Results sort by `root_hint` then `relative_path` so the UI gets stable ordering when you search several trees at once.

```rust
let all_matches: Vec<MatchResult> = candidates
    .par_iter()
    .filter_map(|c| {
        let content = std::fs::read_to_string(&c.path).ok()?;
        let mut lines = Vec::new();
        let mut match_count: u32 = 0;
        for (i, line) in content.lines().enumerate() {
            let line_num = (i + 1) as u32;
            let (found, count) = if let Some(ref r) = re {
                let n = r.find_iter(line).count() as u32;
                (n > 0, n)
            } else if case_sensitive {
                let n = line.matches(&query).count() as u32;
                (n > 0, n)
            } else {
                let lower = query_lower.as_ref().unwrap();
                let n = line.to_lowercase().matches(lower.as_str()).count() as u32;
                (n > 0, n)
            };
            if found {
                lines.push(line_num);
                match_count += count;
            }
        }
        if lines.is_empty() {
            return None;
        }
        let file_path = normalize_path(&c.path);
        let relative = c
            .path
            .strip_prefix(&c.root_canonical)
            .map(|p| normalize_path(p))
            .unwrap_or_else(|_| file_path.clone());
        Some(MatchResult {
            file_path,
            relative_path: relative,
            root_hint: c.root_hint.clone(),
            lines,
            match_count,
        })
    })
    .collect();
```

The frontend wants more than a path string. Each hit carries absolute path, path relative to the chosen root, a short `root_hint` for multi-root searches, matching line numbers, and `match_count` for badges. Keeping that struct flat avoided nested JSON that Vue would unwrap on every keystroke.

```rust
#[derive(Debug, Clone, Serialize)]
pub struct MatchResult {
    pub file_path: String,
    pub relative_path: String,
    pub root_hint: String,
    pub lines: Vec<u32>,
    pub match_count: u32,
}
```

Parallelism buys throughput; **ignore rules** buy you sanity. A match without surrounding lines is a navigation tax, so the UI pushes a three-pane flow: query, file list, preview with syntax hints. The search is only "done" when your eyes confirm it is the right hit.

```text
┌────────────┬───────────────────┬────────────────────────┐
│  matches   │  file / path      │  preview + context     │
│  (list)    │  (navigation)     │  (read / decide)       │
└────────────┴───────────────────┴────────────────────────┘
```

## What I would tell past me

If the tool feels instant in daily use, the architecture is doing its job, even if a paper would prefer a B-tree. I am still poking at smarter skipping (size caps, binary detection), but the core idea, **do not build a second filesystem inside your app**, has held up.
