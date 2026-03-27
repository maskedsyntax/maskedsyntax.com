---
title: "Xenon: mmap vs read() for Huge Files"
date: "2025-09-18"
tags: ["systems", "rust", "mmap", "io"]
summary: "I defaulted to mmap for a big read-only corpus. Sometimes read() + buffers won — this is the notebook of when and why."
reading_time: "14 min"
---

Big file + random-ish access → **mmap** feels like the answer. It often is — until page faults surprise you, or portability matters, or you’re fighting **32-bit** address limits. Xenon was a parser benchmark that turned into a **lesson on I/O strategies**.

## mmap mental model

```text
virtual address space ──maps──► kernel page cache ──► disk
```

Reads become **faults** that pull pages — great for sequential scans, trickier for **latency-sensitive** tiny random reads if you fault often.

## When read() wins

- Strict **memory caps** — mmap ties up VA space.
- **Network filesystems** — fault behavior can be painful.
- Need **clean error handling** per read — mmap signals via SIGBUS unless you’re careful.

## Hybrid approach

```text
metadata: mmap index header
payload:  streaming read for huge sequential passes
```

## Rust: streaming read first (always works)

```rust
use std::fs::File;
use std::io::Read;

fn read_entire(path: &std::path::Path) -> std::io::Result<Vec<u8>> {
    let mut f = File::open(path)?;
    let mut buf = Vec::new();
    f.read_to_end(&mut buf)?;
    Ok(buf)
}
```

When I need **mmap**, I reach for a crate like `memmap2` and map the `File` once — then random access is pointer math + page faults instead of copying through userspace buffers. Same trade as always: **VA space + fault behavior** vs **simplicity**.

## Learnings

- Benchmark on **real** data paths — laptop SSD vs NFS changes the story.
- `madvise(MADV_SEQUENTIAL)` / `WILLNEED` are hints, not contracts.
- Logging page faults is hard — use **wall time** and fault counters where available.

No silver bullet — only **trade-offs** with measurable numbers.
