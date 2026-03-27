---
title: "Rendering CHIP-8 in a Raw Terminal"
date: "2026-03-06"
tags: ["experiments", "nim", "emulation", "terminal"]
summary: "SDL is great. I wanted something I could ssh into and still see pixels — unicode block characters and batching made it workable."
reading_time: "13 min"
---

CHIP-8 is tiny: **64×32** monochrome. That fits in a terminal if you’re okay with chunky pixels. I built a Nim experiment that skips SDL entirely for a “debug mode” — useful over SSH, CI logs, or when you just want **fewer moving parts**.

## The render loop (conceptually)

```nim
for y in 0 ..< 32:
  for x in 0 ..< 64:
    stdout.write(if vram[y][x] == 1: "█" else: " ")
  stdout.write("\n")
```

That’s the naive version. It **works** once. Then you notice flicker.

## Batching output

Each `write` syscall has cost. The fix is a **line buffer** or single `string` build per frame:

```text
BAD:  32 × 64 writes per frame
GOOD: 1 write per frame (or per changed region)
```

Nim version of the same idea:

```nim
var frame = newStringOfCap(64 * 33)
for y in 0 ..< 32:
  for x in 0 ..< 64:
    frame.add(if vram[y][x] == 1: "█" else: " ")
  frame.add('\n')
stdout.write(frame)
```

One syscall (or two with cursor repositioning if you use ANSI).

## Frame pacing

CHIP-8 timers tick at ~60Hz. Your terminal doesn’t. I used a simple sleep / target frame time loop — not perfect, but **stable enough** for demos.

```text
  emulate N instructions
  sleep until frame boundary
  redraw if display dirty bit set
```

## Learnings

- Unicode half-blocks can increase vertical resolution — at the cost of complexity.
- Terminal size changes (`SIGWINCH`) need handling or layouts explode.
- For learning opcodes, **TTY mode** beats canvas — printf debugging stays visible.

I still keep an SDL path for “pretty” mode — but raw terminal taught me more about **throughput** than any shader.
