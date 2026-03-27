---
title: "ColorSnap: Perceptual Distance Isn’t Euclidean"
date: "2025-09-22"
tags: ["experiments", "color", "algorithms"]
summary: "I tried matching colors in RGB and got ugly results. CIEDE2000 fixed the vibe — at the cost of more math."
reading_time: "13 min"
---

“Find the closest palette color” sounds trivial until you do it in **RGB distance** and humans laugh at you. Our eyes don’t treat red/green/blue axes as equal perceptual steps — so I went down the rabbit hole of **ΔE** metrics.

## What went wrong with naive distance

```text
RGB distance:  sqrt(dr² + dg² + db²)
Problem:       equidistant in RGB ≠ equidistant to your eye
```

Two grays can look identical while the numeric distance says “far.”

## Pipeline sketch

```text
sRGB hex ──► linearize ──► Lab space ──► ΔE2000 ──► pick min
```

Lab isn’t perfect, but it’s **closer** to “human nearness” than raw RGB.

## Naive RGB (wrong tool, drawn anyway)

This is the thing I tried first — fast, and misleading:

```python
import math

def rgb_dist(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    dr, dg, db = a[0] - b[0], a[1] - b[1], a[2] - b[2]
    return math.sqrt(dr * dr + dg * dg + db * db)

palette = [(20, 24, 30), (40, 44, 52), (180, 190, 200)]
target = (33, 38, 48)
best = min(palette, key=lambda c: rgb_dist(c, target))
```

Two grays can sit “far” in RGB while looking identical on a monitor — **gamma** and perception aren’t linear.

## Where ΔE plugs in

I don’t paste the full CIEDE2000 here (pages of terms). In practice I either call a tested library or vendor reference code, then lock **golden tests**:

```python
# shape of the API I want — implementation behind it
def delta_e_2000(lab1: tuple[float, float, float], lab2: tuple[float, float, float]) -> float:
    ...
```

Palette colors get converted **once**; each user pick runs comparisons only against those cached Lab tuples.

## Why not CIE76?

CIE76 (`ΔE` in Lab) is faster but **less accurate** in blues. For a palette snapper where users notice hue shifts, I swallowed the complexity of **CIEDE2000**.

## Implementation note

You don’t need to implement the standard from scratch unless you want pain — **test vectors** from published papers / reference implementations save weeks.

## Learnings

- Color science is half **math**, half **psychophysics** — expect hand-wavy thresholds.
- Always show **before/after** swatches — numbers won’t convince you alone.
- Performance: cache Lab for palette entries; compute once.

ColorSnap is a small tool, but it changed how I think about **“close enough”** in UI work.
