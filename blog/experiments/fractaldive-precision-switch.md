---
title: "FractalDive: When Float64 Runs Out of Zoom"
date: "2025-10-28"
tags: ["experiments", "julia", "cuda", "numerics"]
summary: "Deep Mandelbrot zooms eat floating-point precision. I split the pipeline: GPU for normal zoom, BigFloat when pixels stop making sense."
reading_time: "15 min"
---

Fractal zoom videos look magical until coordinates get so tiny that **double precision** collapses and the set turns into soup. FractalDive was my playground for **dynamic precision**: stay fast where you can, get honest when you can’t.

## Two regimes

```text
  shallow zoom                    deep zoom
  -----------                    ---------
  float64 + CUDA OK     ─────►   BigFloat on CPU
  (many pixels/sec)              (few pixels/sec, correct)
```

The trick is **detecting** when you’ve crossed the cliff — distance between neighboring pixels in complex plane vs representable epsilon.

## Velocity Verlet of fractals?

Not quite — but the analogy holds: integrate **view transform** carefully. When the viewport scale underflows, **subdivide** or switch precision rather than pretending.

## CUDA path

For normal exploration:

```text
kernel: z -> z² + c per pixel
block/grid scheduling for occupancy
```

Interruptible rendering matters — users drag sliders; you cancel stale jobs.

## Julia kernel sketch (Mandelbrot-ish)

Not the real kernel — just the “z² + c per pixel” heart:

```julia
function mandel_kernel(maxiter, z, c)
    for n in 1:maxiter
        if abs2(z) > 4.0
            return n
        end
        z = z * z + c
    end
    return maxiter
end
```

On GPU you vectorize / batch; on CPU BigFloat you swap `z` for a higher-precision type when the viewport says so. The **control flow** stays the same — only the numeric type changes.

## Learnings

- **Hybrid pipelines** are ugly but honest — purity at all costs = minutes per frame.
- BigFloat is slow — use it as a **scalpel**, not a default hammer.
- Visual debugging: overlay **precision mode** in the corner so you know why it’s slow.

I still want better automatic scheduling, but the core lesson stuck: **performance and correctness trade along zoom depth**, not just FLOPs.
