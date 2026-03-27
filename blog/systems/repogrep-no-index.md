---
title: "RepoGrep and the No-Index Search Bet"
date: "2026-03-21"
tags: ["systems", "rust", "search", "local-first"]
summary: "I got tired of waiting for indexes to warm up. So I leaned on the one cache that already exists: the OS page cache."
reading_time: "16 min"
---

![RepoGrep Architecture](/images/blog/repogrep-architecture.svg)

Most code search tools want a background daemon, a database, or at least a `.git/index`-style artifact you maintain. I didn’t want another thing to babysit. I wanted: add a folder, hit enter, see matches. If that sounds naive, good — this whole experiment is about **trading away purity for immediacy**.

## What I was actually optimizing for

Not “fastest possible grep on a cold disk.” That’s a different product. I cared about:

- **No stale index** after refactors, branch switches, or deleting half a monorepo.
- **No telemetry** — your code stays on disk, not in my queue.
- **Enough context** that the hit is actionable (more on that later).

So I asked: what if there is **no index** — only parallel traversal + regex, and we let the kernel’s cache do the rest?

## The walk layer

`ignore` + `walkdir` (and friends) give you gitignore-aware traversal without reinventing git. The important bit is threading:

```rust
let walker = WalkBuilder::new(root)
    .hidden(false)
    .git_ignore(true)
    .threads(num_cpus::get())
    .build_parallel();
```

On a warm machine, a lot of those reads never touch the platter. They’re satisfied from **page cache** — which is as close to an index as you get for free.

## ASCII sketch: cold vs warm

```text
  COLD (first run after reboot)
  ----
  disk ──read──► page cache ──► ripgrep-ish scan
         (slow)

  WARM (normal dev day)
  ----
  page cache ──► scan
      (mostly fast)
```

The “no-index” bet is really: **developers run the same searches often enough** that cache heat dominates.

## Where it hurts

- Huge trees on **network filesystems** — cache behavior gets weird.
- First scan after clone — unavoidable work.
- Regex on **massive minified** files — you still pay bytes.

That’s not a moral failure; it’s a product boundary. RepoGrep is happiest when you’re iterating locally.

## Measured shape

![Scan Cost Comparison](/images/blog/repogrep-latency.svg)

I’m not claiming magic constants — different disks, different stories. The chart is really about **shape**: warm cache queries land in a band that feels interactive.

## Worker pool (Rust-shaped)

Traversal is embarrassingly parallel; matches need **aggregation** without fighting:

```rust
use std::sync::mpsc;
use rayon::prelude::*;

fn scan_roots(roots: Vec<PathBuf>, pattern: &Regex) -> Vec<Match> {
    let (tx, rx) = mpsc::channel();
    roots.par_iter().for_each_with(tx, |tx, root| {
        for m in walk_and_scan(root, pattern) {
            tx.send(m).ok();
        }
    });
    drop(tx);
    rx.into_iter().collect()
}
```

Real code adds cancellation, ignore caches, and backpressure — but **channel + rayon** is the spine.

## Context isn’t optional

A match without surrounding lines is a navigation tax. The UI pushes **three-pane** flow: query → file list → preview with syntax hints. The search is only “done” when your eyes confirm it’s the right hit.

```text
┌────────────┬───────────────────┬────────────────────────┐
│  matches   │  file / path      │  preview + context     │
│  (list)    │  (navigation)     │  (read / decide)       │
└────────────┴───────────────────┴────────────────────────┘
```

## What I’d tell past me

- Treat the OS cache as a **hint**, not a contract.
- Parallelism buys you throughput; **ignore rules** buy you sanity.
- If the tool feels instant in daily use, the architecture is doing its job — even if a paper would prefer a B-tree.

I’m still poking at smarter skipping (size caps, binary detection), but the core idea — **don’t build a second filesystem inside your app** — has held up.
