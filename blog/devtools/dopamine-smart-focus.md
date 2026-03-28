---
title: "Dopamine: channels and a message enum in Ratatui"
date: "2025-11-18"
tags: ["devtools", "rust", "tui", "audio"]
summary: "A terminal music player is one screen and many producers. I stopped fighting that with shared mutable state and leaned on a boring mpsc queue instead."
reading_time: "5 min"
---

I used `ncmpcpp` for years. It is fast, predictable, and stays out of the way. It also made me greedy: I wanted lyrics next to the queue, MPRIS so the desktop keys still worked, and library rescans without freezing the UI. None of that is exotic. The hard part is that **a TUI owns the tty**. Everything else wants to poke the same structs from threads, timers, and DBus callbacks. The first versions of Dopamine that felt bad were not wrong about SQLite or audio APIs. They were wrong about **who is allowed to touch `App`**.

## The rule I wish I had written first

**Draw and input run in one loop. Everyone else sends mail.** Background work gets a clone of an `mpsc::Sender`. The main thread drains the mailbox at the start of each frame, applies updates, then paints. If that sounds like a GUI event loop with extra steps, it is. Ratatui does not hide the loop; it rewards you for keeping it dumb.

The enum stayed small on purpose. Scan progress, MPRIS buttons, and lyrics results are all just variants. I refused to add a second channel for "urgent" messages because splitting streams is how you recreate races with extra steps.

```rust
enum Message {
    ScanStarted,
    ScanProgress(usize, usize),
    ScanFinished,
    MprisPlayPause,
    MprisNext,
    MprisPrevious,
    LyricsFetched(String, String), // path, content
}
```

`try_recv` in a tight loop collapses bursts: ten progress ticks in one frame become one visible jump, which is what you want when a scan walks tens of thousands of files. When the scan finishes, the same drain path reloads tracks from SQLite so the library pane and the in-memory vectors stay aligned.

```rust
while let Ok(msg) = rx.try_recv() {
    match msg {
        Message::ScanStarted => {
            app.scanning = true;
            app.scan_progress = (0, 0);
        }
        Message::ScanProgress(curr, total) => {
            app.scan_progress = (curr, total);
        }
        Message::ScanFinished => {
            app.scanning = false;
            let _ = app.load_tracks();
        }
        Message::MprisPlayPause => app.toggle_playback(),
        Message::MprisNext => app.play_next(),
        Message::MprisPrevious => app.play_prev(),
        Message::LyricsFetched(path, content) => {
            let is_error = content == "No lyrics available";
            // patch every Track with the same path: library, search, queue
        }
    }
}
```

`LyricsFetched` is the annoying case. The same file can appear in three panes. Updating one vector and forgetting another looks like "the UI is haunted." Walking lists to patch by path is brute force, but it is honest. The sentinel string for missing lyrics is ugly; it beats throwing errors through a channel that was designed for happy-path UI updates.

## Where I almost deadlock myself

Decode and output sit in `rodio` / `cpal` land, not inside `terminal.draw`. Early experiments let audio callbacks borrow `App` or poke Ratatui state. That ends in either deadlock or frames that stutter when the decoder hiccups. Now anything the UI needs from audio flows through integers, atomics, or messages, never through "just call this method from the callback."

SQLite is `rusqlite` with a schema that grew the way personal tools grow: new columns when I needed them, occasional `VACUUM` after huge rescans. Migrations are ad hoc. Cancelation is coarse (stop scheduling work, do not pretend threads are preemptive). That is fine for a player I run on one machine; it would not pass a code review at a streaming company, and I am okay with that.

## What manual testing taught me

Pure helpers on `Track` lists get unit tests. The TUI itself gets a checklist before I tag anything, because `crossterm` wants a real tty and I am not maintaining a fake terminal harness for a side project. The trade is speed of iteration versus automated confidence, and for this repo iteration wins.

Optional config (TOML or JSON depending on the week) sets library roots. I normalize paths with `canonicalize` when the OS gives me one so symlinked music dirs do not duplicate rows. Queue semantics are intentionally boring: next and previous wrap, repeat and shuffle flags exist on the model even when every keybinding is not wired yet.

DBus session absence is a quiet case: MPRIS messages simply never arrive and local keys still work. That is the kind of behavior I want from a daily driver, not a demo that assumes a full desktop stack.

## After

Dopamine is still a wish list with a spine. The spine is **event, then state, then draw**, even when the events are plain Rust enums instead of a framework. Everything else, lyrics providers, gapless playback, theme polish, is allowed to churn as long as the channel boundary stays clean.
