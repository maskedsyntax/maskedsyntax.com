---
title: "Celestia: From O(N^2) to O(N log N)"
date: "2026-03-13"
tags: ["ml", "simulation", "fortran", "barnes-hut"]
summary: "I wanted pretty orbits without melting my laptop. Barnes-Hut + Velocity Verlet turned a toy into something I could actually run overnight."
reading_time: "18 min"
---

![Barnes-Hut Concept](/images/blog/celestia-barnes-hut.svg)

Gravity is simple until it isn’t. Pairwise forces for N bodies scale like O(N²). At a few hundred particles you’re fine. At tens of thousands, you start **feeling** the quadratic — fans spin, progress bars lie, and you question your life choices.

Celestia was my excuse to implement something I’d only read about: **Barnes-Hut** — group far-away mass into buckets so you don’t visit every pair.

## What I wanted from the integrator

Raw Euler steps explode energetically on long runs. I used **Velocity Verlet** — symplectic-ish, stable enough for orbits:

```fortran
! Velocity Verlet (per step)
v_half = v + 0.5d0 * a * dt
x_new = x + v_half * dt
! compute a_new at x_new
v_new = v_half + 0.5d0 * a_new * dt
```

Not fancy on paper. **Huge** in practice when you want rings that don’t drift into soup.

## Barnes-Hut in a napkin sketch

Build an octree. For each body, walk the tree:

- If a cell is far enough away (opening angle criterion), treat its total mass as a **single** attractor at its center of mass.
- If it’s too close, recurse.

```text
         root cell
        /    |    \
       /     |     \
   near     far     far
   bodies   lump    lump
            as 1    as 1
```

You spend log-ish time per body *in friendly distributions* — way better than all-pairs.

## Inner loop (still Fortran-shaped)

Pairwise gravity for a subset (conceptually — real code uses tree walks):

```fortran
! Naive inner pair — BH replaces this with tree traversal
do i = 1, n
  do j = i + 1, n
    rij = r(:,j) - r(:,i)
    dist2 = dot_product(rij, rij) + softening**2
    invr = 1.0d0 / sqrt(dist2)
    fij = G * m(i) * m(j) * rij * (invr**3)
    a(:,i) = a(:,i) + fij / m(i)
    a(:,j) = a(:,j) - fij / m(j)
  end do
end do
```

OpenMP parallelizes the **outer** `i` loop once the algorithm is safe — BH is where the complexity win lands.

## Results I could stare at

![Complexity Trend](/images/blog/celestia-complexity.svg)

The chart is really “look, it bends” — exact constants depend on how clustered your simulation is.

## Where I messed up early

- **Softening** too small → scary accelerators at close range.
- **Tree rebuild** every step vs amortized — profiling matters.
- Forgetting that BH is an **approximation** — energy non-conservation shows up if you’re sloppy.

## Learnings

- Pretty physics beats fast wrong physics. Users (me) notice drift.
- Fortran + OpenMP is still a cheat code for tight numeric loops.
- Visualization isn’t vanity — it’s how you catch sign errors before they compound.

I’m not shipping a universe simulator — I’m shipping **confidence** that I understand the pipeline. That’s enough.
