---
title: "Canvaz: Talking to X11 Without `feh`"
date: "2025-12-04"
tags: ["systems", "cpp", "x11", "linux"]
summary: "I got tired of shelling out to wallpaper scripts that broke every other update. Wiring X11 directly was more code — and fewer surprises."
reading_time: "14 min"
---

Tiling WMs attract **minimalist** tooling — which often means a pile of shell scripts around `feh`, `nitrogen`, or whatever survived last year’s distro upgrade. Canvaz was my attempt to **own the integration**: scan images, pick one, set the **root window pixmap**, persist session state.

## Why direct X11?

```text
wrapper script ──► feh ──► X11
      │                    │
      └── breaks when      └── stable ABI-ish surface
          flags change
```

Fewer forks, fewer temp files, fewer “works on my machine” moments.

## Rough data flow

```text
directory scan ──► decode thumbnails (async)
       │
       ▼
 user picks ──► set root window atoms / pixmap
       │
       ▼
 save last choice for next login
```

The interesting bugs were **never** image decoding — they were atom names, color depths, and multi-monitor weirdness.

## X11-ish pseudocode (not copy-paste safe)

Setting a root pixmap is “simple” until you remember colormaps exist:

```cpp
// Pseudocode — real code needs error checks, depths, formats
Display* d = XOpenDisplay(nullptr);
Window root = DefaultRootWindow(d);
Pixmap pix = load_image_to_pixmap(d, path, root);
// XSetWindowBackgroundPixmap(d, root, pix);
// XClearWindow(d, root);
// XFlush(d);
```

In practice I lived in `xprop`, `xdpyinfo`, and the ICCCM docs until atoms lined up.

## Learnings

- X11 is old, but **documented**. Random shell tools are not.
- Thumbnail generation should be **bounded** — don’t scan `/` by accident.
- Session restore needs a story for “image deleted since last time.”

I still want a Wayland path — X11 won’t live forever — but understanding the legacy protocol made the behavior **predictable**.
