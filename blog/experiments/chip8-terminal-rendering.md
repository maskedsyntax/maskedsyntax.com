---
title: "CHIP-8 in the terminal with Nim"
date: "2026-03-06"
tags: ["experiments", "nim", "emulation", "terminal"]
summary: "SDL was easy mode. SSH was the real test. The win was not Unicode bravado, it was shutting up the kernel until the frame was ready."
reading_time: "5 min"
---

CHIP-8 is sixty-four by thirty-two pixels. That is small enough to pretend the screen is a grid of characters instead of a texture. I still built SDL first, because seeing pixels is the fastest way to know the CPU is not lying. The feature I actually wanted was **running the same ROM over SSH** on a machine that does not have a compositor, a window, or patience for my hobby projects.

So `display.nim` grew a `useTerminal` branch. The lesson that stuck was not which glyph looks coolest. It was **how expensive naïve IO is** when you pretend each cell is a free syscall.

## The strace afternoon

The first terminal backend did the obvious thing: nested loops, `stdout.write` per cell, flush whenever it felt right. It worked. It also felt sluggish in a way SDL did not. One `strace` later the picture was clear: I was spamming the kernel with tiny writes. The fix was always the same old advice: **build one string, move the cursor home once, flush once.**

```nim
proc render*(d: Display, c: Chip8) =
  if d.useTerminal:
    var output = "\x1B[H"
    output.add("+" & "-".repeat(SCREEN_WIDTH) & "+\n")
    for y in 0 ..< SCREEN_HEIGHT:
      output.add("|")
      for x in 0 ..< SCREEN_WIDTH:
        if c.display[y * SCREEN_WIDTH + x]:
          output.add("#")
        else:
          output.add(" ")
      output.add("|\n")
    output.add("+" & "-".repeat(SCREEN_WIDTH) & "+\n")
    output.add("\n[Press Ctrl+C to Exit]\n")
    stdout.write(output)
    stdout.flushFile()
```

`#` instead of full block characters keeps fonts and SSH encodings boring, which is a feature when you demo on someone else's terminal. ANSI home (`\x1B[H`) updates in place without nuking scrollback history, which matters when you still want to read compiler output above the playfield.

Init hides the cursor; cleanup restores it and clears. Those details are easy to skip when you are excited about opcodes; they are what separate "works on my laptop" from "does not wreck a shared tmux session."

## Two backends, one CPU

SDL mode packs the same `c.display` buffer into a texture path: ARGB pixels, `updateTexture`, present. Both backends read the bitmap identically, so when a game looked fine in SDL and wrong in the terminal, I knew the bug lived in the core, not in `#` versus block glyphs. That split saved hours of false leads.

Audio in TTY mode is deliberately crude: `beep` writes the bell character. It ties the sound timer to something you can hear without pulling in another dependency stack. Good enough for demos; embarrassing enough that I remember it is a stub.

## Input, timers, and debugging

Terminal input goes through `setRawMode()` for the run, restored on exit. `pollInput` feeds keys; the main loop clears `c.keys` after instruction batches so CHIP-8 semantics stay edge-like. SDL reuses the same module without raw mode, which keeps the call sites small.

When I needed disassembly, `--debug` existed. When I needed to printf without corrupting the frame, stderr stayed for logs and stdout stayed for control sequences. Mixing those is how you get "random" corruption that looks like emulator bugs.

Half-block Unicode could double vertical resolution; I did not ship it as default because column math and `SIGWINCH` disagree across clients. If you try it, plan for resize and clamp width so borders still line up.

`main.nim` paces IPS and the sixty-hertz timers separately with a monotonic clock. Games feel sane around five hundred to one thousand IPS; `--ips` is there for taste. ROMs load at `0x200`; tests in `tests/test_opcodes.nim` catch shift and carry edge cases before I touch display code again.

Public domain ROMs stay out of the repo for licensing hygiene; the README points at sane drop-in locations. That small friction matters when you share the emulator but not a bundle of questionably sourced games.

Frame pacing is whatever the host scheduler offers; CHIP-8 timers are coarse enough that a simple sleep loop is acceptable for demos. I stopped chasing sub-millisecond accuracy because the platform noise from SSH and terminal emulators dominates anyway.

SDL mode still wins when I want to record or share a clip; the terminal path wins when I want to prove the CPU core is portable. Keeping both paths behind one `render` proc is a discipline thing, not a performance thing. When opcode bugs show up in both backends, I stop blaming the console and start reading the spec again.

## After

I still use SDL when I want a clip or a screenshot. I use the terminal when I want proof the emulator is **not married to any one graphics API**. If you fork the repo, keep both paths behind one `render` proc so opcode semantics cannot drift between "pretty" and "SSH."
