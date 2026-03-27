---
title: "Dopamine: Smart Focus Navigation in TUIs"
date: "2025-11-18"
tags: ["devtools", "rust", "tui", "audio"]
summary: "I kept building Ratatui screens until the focus logic turned into spaghetti. The fix was embarrassingly classic: treat the UI like Elm-ish state, not a pile of ifs."
reading_time: "14 min"
---

Music players in the terminal are a trap: playlists, search, lyrics, progress bars — each wants **keyboard focus** and async updates. My first Dopamine prototype “worked” until I tried to add **queue reordering** while a scan ran in the background. Focus jumped, selections desynced, and I questioned my life choices.

## The pattern that saved me

```text
   user input
       │
       ▼
   Message ──► update(Model, msg) ──► new Model
       │                    │
       │                    └──► render(View from Model)
       │
       └── background tasks send Messages too
```

No hidden globals deciding “who is focused.” The model is **truth**.

## Why messages beat callbacks

Callbacks compose until they don’t. With messages, you can log them, replay them, and **test** update logic without spinning up a terminal.

Sketch:

```rust
enum Msg {
    Tick,
    Key(KeyEvent),
    LibraryScanProgress(usize),
}

fn update(model: &mut Model, msg: Msg) {
    match msg {
        Msg::Key(k) => model.panes.handle(k),
        Msg::LibraryScanProgress(n) => model.status = format!("indexed {n}"),
        // ...
    }
}
```

## Audio thread boundaries

Audio wants **real time**. UI wants **flexibility**. Crossing the streams naively = stutter.

```text
  audio thread          channel           UI thread
  ------------          -------           ---------
  decode ─────────────► mpsc ───────────► level meters
```

Never block the audio path on TUI layout.

## Channel wiring (Rust-flavored)

```rust
use std::sync::mpsc;

let (tx_ui, rx_ui) = mpsc::channel::<UiMsg>();
let (tx_audio, rx_audio) = mpsc::channel::<AudioCmd>();

// UI thread: rx_ui + sends AudioCmd
// Audio thread: rx_audio, never touches Ratatui
```

The invariant: **audio never calls into the TUI stack**. If levels need to show in the UI, copy a number atomically or send a tiny `LevelSnapshot` message — never borrow `Model` across threads.

## Learnings

- Ratatui is not a framework — **you** bring architecture.
- If you can’t draw your state machine, you don’t have one yet.
- “Feels fast” correlates with **predictable focus**, not raw FPS.

I still fight edge cases (modal overlays, mouse support), but the spine — **event → pure-ish update → render** — is the part I’d keep in any future TUI.
