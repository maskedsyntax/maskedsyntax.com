---
title: "Pod Ricing: Config-Driven Desktop Tweaks"
date: "2025-10-04"
tags: ["systems", "linux", "dotfiles"]
summary: "I kept copying shell snippets between machines. A tiny 'pod' config + idempotent apply scripts made ricing less fragile."
reading_time: "12 min"
---

“Ricing” is fun until you have three machines and **six** half-forked dotfiles. I wanted a **declarative-ish** bundle: fonts, GTK themes, i3/sway snippets, wallpaper paths — applied with checks, not `cp` chaos.

## Shape of the idea

```text
pod.yaml
   │
   ├── packages (distro-specific blocks)
   ├── symlink map
   └── post-install hooks (idempotent)
```

Running `pod apply` should be safe to repeat — **the test** of good provisioning.

## What `pod.yaml` might look like

Nothing fancy — just enough structure that I’m not editing six shell files:

```yaml
profile: laptop
packages:
  arch:
    - sway
    - waybar
    - alacritty
links:
  - from: dotfiles/alacritty.yml
    to: ~/.config/alacritty/alacritty.yml
  - from: dotfiles/sway/config
    to: ~/.config/sway/config
hooks:
  post:
    - command: fc-cache -f
```

The **links** section is the spine; `hooks` are for cache refreshes after fonts land.

## Idempotency tricks

```bash
# pattern: only write if content differs
cmp -s "$src" "$dst" || cp "$src" "$dst"
```

Same for templated configs — hash or diff before overwrite.

## Learnings

- **Document assumptions** (which distro, which WM) — future you forgets.
- Secrets don’t belong in the same repo — use **age**/**sops** or keep them out.
- Small tools beat giant Ansible when you’re only configuring **one user**.

The repo is personal — the pattern is universal: **make repetition boring**.
