---
title: "mmap versus read for big read-only blobs"
date: "2025-09-18"
tags: ["systems", "rust", "mmap", "io"]
summary: "These notes lived next to a parser benchmark I was running while working on other projects. They are about when mapping pages beats copying through userspace, not about a single repo."
reading_time: "5 min"
---

I kept reaching for `mmap` whenever a file was "big" and access looked random. Sometimes that was right. Sometimes I traded simple error handling for page faults I did not expect. This post collects rules of thumb from timing loads on local SSDs, a spinning disk, and one unhappy NFS mount. It applies anywhere you touch large read-only data in Rust or C++. The blog filename is historical; the content is general IO, not a claim that every project I ship maps files this way. Xenon the app uses Qt and loads documents through higher-level APIs; the same thinking still applies when you add a log viewer or binary preview.

## What mmap buys you versus streaming read

You map bytes into the address space. Reads become faults the kernel satisfies from the page cache. Sequential scans can be extremely cheap once pages are hot because you are not copying whole blocks into your own buffers on every access.

```text
your VA range  --->  page cache  --->  disk (on miss)
```

`read` (or Rust `Read::read_to_end`) pulls bytes through userspace buffers. It is predictable: errors return `Result`, you do not think about `SIGBUS`, and you are not consuming virtual address space proportional to file size.

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

On 32-bit targets, huge mappings are a non-starter. On network filesystems, a fault can stall harder than a read loop you control. For "open, parse once, close," `read_to_end` is often the whole program. Small files and test fixtures load into vectors so tests stay hermetic without temp mmap files.

## When I still map, hybrid patterns, and ergonomics

I reach for `memmap2` (or equivalent) when the file is read-only for the process lifetime and **random access** dominates, when I can tolerate fault-driven latency spikes and I am not on flaky remote storage, or when multiple processes should share cached pages without extra copies. The hybrid pattern I use most is a small mapped header plus streaming reads for a huge sequential tail.

```rust
use memmap2::MmapOptions;
use std::fs::File;

fn map_readonly(path: &std::path::Path) -> std::io::Result<memmap2::Mmap> {
    let file = File::open(path)?;
    let map = unsafe { MmapOptions::new().map(&file)? };
    Ok(map)
}
```

`unsafe` is there because you promise not to break aliasing rules and because you must not use the slice after another process truncates the file. For robust tools, `flock` or an explicit version file can catch concurrent writers. `map_readonly` avoids accidental writes through the slice; mutable maps need `MmapMut` and careful synchronization with writers on other threads.

`memmap2::MmapOptions::map` gives a slice-like view. Parsing with zerocopy-style readers feels nice until you remember alignment and endianness; I still add unit tests on little-endian hosts I use daily. `madvise` hints nudge the kernel; they are not contracts, like compiler `inline`.

## NFS, portability, and what I actually benchmark

On network mounts I default back to `read` with a modest buffer size. Fault latency is harder to reason about than `read` returning `EINTR` or a short count. I log wall time around the first cold open so I do not confuse slow disk with a bad parser.

`read_to_end` is boring portable Rust. `mmap` is POSIX-flavored even when wrapped nicely; Windows needs separate mapping APIs for parity. Huge pages change fault behavior; most tools ignore that unless you tune databases.

## After the experiments

I stopped treating mmap as the default big-file API. It is an optimization with operational caveats. For public tools, I expose both paths when it matters: load whole file for tests and small inputs, map read-only for the benchmark harness.

If you only remember one thing: **benchmark on the storage you actually use**, not the laptop SSD next to your desk. The winner flips more often than I expected.

Container mounts and bind mounts add another layer: the same binary can look fast in CI on overlayfs and slow on a bind-mounted NFS home. I stopped trusting "it benchmarks fine on my laptop" for anything that maps whole corpora.

When mentors say "just mmap it," ask which filesystem and which access pattern. The advice is often shorthand for "I only tested sequential read on local ext4."

`SIGBUS` on mapped files is rare in my daily work but memorable enough that I mention it in onboarding notes for interns touching parsers. Knowing it exists changes how you write error messages when a user truncates a file under you.

I still keep a `read_to_end` fast path in benchmarks out of stubbornness: it is the baseline that mmap must beat, not the other way around. Declaring mmap the winner without that comparison is how blog posts become folklore.
