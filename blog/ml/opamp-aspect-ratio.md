---
title: "OpAmp Layout: Aspect Ratios That Actually Manufacture"
date: "2025-10-30"
tags: ["ml", "vlsi", "layout"]
summary: "I chased symmetric aesthetics until DRC explained that manufacturability beats pretty rectangles. Lesson learned the loud way."
reading_time: "13 min"
---

Analog layout looks like drawing until you meet **DRC** (design rules). My first op-amp floorplan had “balanced” shapes that were **illegal** or fragile under process variation. This note is part therapy, part checklist.

## What DRC is really asking

```text
 min width / spacing
  │
  ├── prevents opens/shorts
  └── matches fab tolerances
```

Rules aren’t suggestions — they encode **physics + lithography limits**.

## Aspect ratio intuition

Long skinny resistors **meander** for a reason: you need value **and** matching — sometimes folding beats a straight bar.

```text
   bad for matching          better: interdigitated pair
   ----------------          -----------------------------
   |-------|                 |/\/\/\/\/|
```

Matching pairs want **symmetry** under the same gradients — not just mirrored shapes in the viewer.

## DRC checks as “code”

PDK rules show up as constraints you can’t hand-wave. Conceptually:

```text
width(poly)   >= 0.15 um
space(metal1) >= 0.14 um
via enclosure >= 0.05 um each side
```

In a deck, that becomes thousands of checks. A **DRC report** is like a compiler error list — you iterate until clean:

```text
# invented example output shape
M1.S.1 : 0.12um < 0.14um required at (12.4, 8.1)
POLY.W.1 : poly width 0.13um < 0.15um at (3.2, 1.0)
```

Fixing isn’t “make it prettier” — it’s **move geometry** until the report is empty.

## A tiny “matching pair” layout sketch (ASCII)

```text
   device A          device B
   |||||||||         |||||||||
   |||||||||         |||||||||   same orientation, same surroundings
   ---------         ---------
```

Asymmetric surroundings (different nearby metal density) **mismatch** devices even if polygons look mirrored in the editor.

## Simulation vs layout

You can simulate ideal components — manufacturing connects them with **parasitics**. If your layout ignores capacitance to substrate, your bandwidth dreams evaporate.

## Learnings

- Start from **process design kit** defaults; inventing your own grid is ego.
- **Review with peers** — your eyes stop seeing notch violations.
- Pretty screenshots ≠ yield.

I’m still a beginner at analog layout, but I stopped treating it as graphic design.
