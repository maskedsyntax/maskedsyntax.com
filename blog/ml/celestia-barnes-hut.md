---
title: "Celestia: octree build in Fortran"
date: "2025-10-12"
tags: ["ml", "fortran", "n-body", "simulation"]
summary: "Celestia is Newtonian gravity with Barnes-Hut. tree.f90 partitions bodies into eight octants and recurses until each leaf holds one particle."
reading_time: "5 min"
---

Celestia is an N-body lab in Fortran with OpenMP, velocity Verlet integration, optional collisions, and CSV output for a web viewer. The Barnes-Hut speedup lives in `tree.f90`. Building the tree is the interesting code path: assign each body to an octant, allocate child arrays, recurse. Internal nodes aggregate mass and center of mass; leaves point at a single `body_t`.

```fortran
type :: node_t
   real(dp), dimension(3) :: center = [0.0_dp, 0.0_dp, 0.0_dp]
   real(dp) :: size = 0.0_dp
   real(dp) :: mass = 0.0_dp
   real(dp), dimension(3) :: com = [0.0_dp, 0.0_dp, 0.0_dp]
   type(body_t), pointer :: body => null()
   type(node_t), pointer, dimension(:) :: children => null()
   logical :: is_leaf = .true.
end type node_t
```

`build_tree` is recursive: one body makes a leaf; otherwise split into eight octants using three bitwise tests against the node center, count bodies per bucket, allocate slices, recurse. I simulated all-pairs first; at a few hundred bodies the homework finished overnight. The tree homework was the first time complexity class matched a profiler graph I generated myself.

## Forces, softening, and OpenMP

`physics.f90` applies gravitational softening to avoid singularities. `eps_sq` limits force spikes during close passes; tuning trades numerical stability against realism in dense cores. `main.f90` drives timesteps. OpenMP parallel regions spread the hot force loop across cores once the tree is built. The tree builds serially, then forces compute in parallel; trying to build in parallel without coloring invited races. Collisions merge bodies in `collisions.f90` when radii overlap, using the inelastic model from the README.

## Integrators: Verlet versus RK4

`main.f90` accepts `--integrator verlet` or `rk4`. Velocity Verlet is the default symplectic choice for long runs. RK4 appears in `integrate_rk4` inside `physics.f90`, rebuilding the Barnes-Hut tree at each stage when enabled:

```fortran
subroutine integrate_rk4(bodies, root_info, G, theta, dt)
    ! k1 = f(t, y)
    do i = 1, n
       k1_v(:, i) = bodies(i)%vel
       k1_a(:, i) = bodies(i)%acc
    end do
    ! ... midpoint stages rebuild the tree via rebuild_tree_local ...
end subroutine
```

`compute_total_energy` and printed relative drift (as a fraction of initial total) sanity-check integrations: Verlet drift should stay bounded; RK4 may behave differently on long horizons. You can compare integrators in the terminal without plotting tools.

## Output, viewer, and parameters

`io_utils.f90` appends CSV rows with time, id, mass, position, and velocity per body. `export_binary` writes an unformatted stream when you want smaller snapshots and a matching Fortran reader. `to_js.py` converts CSV steps into a JS bundle a static viewer loads, so the Fortran core stays free of graphics dependencies and headless-friendly on clusters.

`galaxy_step.csv` grows one row per body per recorded step. Softening length controls how close approaches behave; I sweep it when swapping initial conditions from `initial_conditions.f90`. `make` compiles with OpenMP flags from the Makefile. Optional timing hooks in `profiler.f90` wrap tree build and force evaluation when enabled; I compare Barnes-Hut against brute force on small N to verify the tree matches within epsilon.

## After

Celestia is coursework-grade, not astrophysics production. The educational win is seeing **O(N log N)** tree build in a language people think is dead. Fortran's array syntax still fits scientific loops well.

Splitting visualization into Python and JS kept grading simple: TAs run the binary, inspect CSV or binary dumps, and only optionally open the viewer. Students who break the integrator still get partial credit on tree construction because those pieces are separable in the source tree.

I still reach for brute force on tiny N when I change force softening or collision rules. If the tree and the all-pairs reference disagree, I trust the slower answer until I find the bug in the multipole acceptance criterion, not the other way around.

The Barnes-Hut theta parameter is the usual knob: too large and multipole error shows up as drifting energy; too small and you paid for a tree walk that behaves like naive summation. I log max depth and leaf counts when debugging acceptance bugs so I can tell "tree is degenerate" from "integrator is unstable."

Fortran gets a bad rap for IO; here IO is deliberately boring so the interesting code stays in `physics.f90` and `tree.f90`. That separation made code reviews faster: nobody argues about CSV column order in the same breath as octree splits.

Collision handling is the other sanity check: merged bodies change mass budgets and can inject energy if the restitution model is sloppy. I treat collisions as optional in long galaxy runs because they turn debugging from "force math" into "event scheduling," which is a different course module. Toggling them off is the fastest way to isolate tree regressions when energy drifts and you are not sure whether to blame the integrator or contact events.
