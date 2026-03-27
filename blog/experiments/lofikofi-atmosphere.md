---
title: "Lofikofi: Designing an Offline-First Atmosphere"
date: "2025-10-08"
tags: ["experiments", "tauri", "vue", "product"]
summary: "I didn't want another tab — I wanted a room. Local audio, a timer, and zero network calls when I'm trying to think."
reading_time: "14 min"
---

Most “focus” apps live in the browser, which means **notifications**, **autoplay policies**, and **CDN assets** you don’t control. I wanted the opposite: a small desktop shell that feels like **opening a door**, not clicking a bookmark.

Lofikofi is that experiment — ambient loops, a focus timer, everything **bundled** so airplane mode doesn’t change the UX.

## What “atmosphere” means here

Not hi-fi marketing audio. Just **layers** you can blend:

```text
   rain ────┐
   cafe ────┼──► mixer ──► output
   fire ────┘
```

Each layer is a loop with its own gain. The implementation is intentionally boring: decode, mix, play. No ML, no “smart focus score.”

## Why Tauri + web UI?

I like shipping UI fast with Vue. Tauri keeps the shell small and **local-file friendly** for assets compared to shipping Electron for something this simple.

```text
┌─────────────────────────────┐
│  WebView (Vue)              │
│  sliders, timer, presets    │
├─────────────────────────────┤
│  Tauri core / audio I/O     │
└─────────────────────────────┘
```

The boundary matters: UI state is ephemeral; **audio graph** setup is where bugs hide (device selection, suspend/resume).

## Offline as a feature

Bundling megabytes of audio isn’t free. The trade is:

- **Pros**: predictable latency, no spinner, privacy (nothing phones home).
- **Cons**: download size, asset updates ship with app releases.

For a personal tool, I’ll take it.

## Presets on disk (JSON)

I keep user mixes boring and editable:

```json
{
  "name": "rain + soft keys",
  "layers": [
    { "id": "rain", "gain": 0.7 },
    { "id": "cafe", "gain": 0.15 }
  ],
  "timer": { "focus_min": 25, "break_min": 5 }
}
```

Load on startup, save on change — no server, no merge conflicts with a cloud.

## Learnings

- Atmosphere apps compete with **silence** — the UX has to stay out of the way.
- Local-first is a **feel**, not a checkbox. Network errors should be impossible in normal use.
- Timers + audio share one lesson: **defaults beat customization** you never touch.

I still tweak levels and scenes, but the product thesis hasn’t moved: **calm, local, one window.**
