---
title: "pulsefetch: Zero-Alloc Hot Paths in System Tools"
date: "2025-09-30"
tags: ["systems", "rust", "audio", "cli"]
summary: "A neofetch clone for PulseAudio taught me that tiny CLIs still benefit from caring about allocations — especially when you poll in a loop."
reading_time: "13 min"
---

`neofetch` is delightful. I wanted something narrower: **pulseaudio sink status**, pretty in the terminal, cheap enough to run in **prompt hooks** without lag. pulsefetch became an exercise in **zero-allocation** hot loops.

## Where allocations sneak in

- `format!` every tick.
- `String` concatenation in log lines.
- `Vec` growth inside polling.

None matter once — they matter at **60Hz** or in a tight loop.

## Pattern: buffers

```text
reuse String / Vec capacity
write into fmt::Formatter when possible
avoid temporary to_string in steady state
```

Rust makes this visible — which is annoying and **good**.

## Reusing buffers (concrete)

```rust
let mut line = String::with_capacity(256);

fn tick_line(snapshot: &Snapshot, out: &mut String) {
    out.clear();
    use std::fmt::Write;
    let _ = write!(
        out,
        "vol {:>3}% {}  {}",
        snapshot.volume,
        if snapshot.mute { "muted" } else { "     " },
        snapshot.name
    );
}
```

Same `String` every frame — allocator stays cold.

## Audio API reality

PulseAudio callbacks don’t love blocking. Keep queries **short**, marshal to a **snapshot struct**, render elsewhere.

```text
audio thread / poll ──► Snapshot { volume, mute, name }
                              │
                              ▼
                         render thread (rare)
```

## Learnings

- Profile before heroics — sometimes the bottleneck is **subprocesses**, not your code.
- `#[inline]` isn’t a personality trait — measure.
- Pretty output still needs **bounded width** — terminals aren’t infinite.

For a toy fetch script, the lesson generalizes: **hot paths deserve budget**, even when “it’s just a CLI.”
