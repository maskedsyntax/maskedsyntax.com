---
title: "IntelliPath: A* Visualization as Debugging"
date: "2025-10-16"
tags: ["experiments", "python", "algorithms"]
summary: "My A* was wrong in boring ways — bad ties, bad heuristics. Drawing the frontier made the bugs obvious instead of theoretical."
reading_time: "14 min"
---

I’ve implemented A* on grids maybe five times. Every time I **think** I remember the details — until diagonals, walls, or the priority queue tie-breaking produce a path that **looks** right and isn’t. IntelliPath was my excuse to **watch** the algorithm instead of staring at numbers.

## The loop I kept on screen

```text
  open_set (priority queue)
       │
       ▼
  pop lowest f ──► if goal: done
       │
       ▼
  expand neighbors
       │
       ▼
  push with updated g, f
       │
       ▼
  render frontier + current best path
```

When something’s wrong, you see **weird growth** — poking into corners, oscillating frontiers, never reaching the goal.

## Heuristic lies

Manhattan distance is only admissible on **4-connected** grids. Flip to 8-connected without changing the heuristic and you get **suboptimal** paths or broken assumptions depending on your implementation.

```text
4-neighbor:  |a-b|_1 style heuristics
8-neighbor:  often diagonal costs need sqrt(2) weighting — check your graph
```

## Tie-breaking is a feature

When `f` ties, **which node** you expand changes shapes. I tried:

- lower `g` first (prefer shorter known paths),
- stable ordering by coordinates (reduces jitter).

Neither is “correct” universally — but **pick one** and stay consistent.

## Minimal Python skeleton (grid, 4-neighbor)

This is the shape I keep reusing — not optimized, but **readable**:

```python
import heapq

def astar(grid, start, goal, h):
    # grid[y][x]: 0 = walkable, 1 = wall
    open_heap = []
    heapq.heappush(open_heap, (h(start, goal), 0, start))
    came_from = {}
    g = {start: 0}

    while open_heap:
        _, _, current = heapq.heappop(open_heap)
        if current == goal:
            return reconstruct(came_from, current)
        for nb in neighbors4(grid, current):
            if grid[nb[1]][nb[0]] == 1:
                continue
            tentative = g[current] + 1
            if tentative < g.get(nb, float("inf")):
                came_from[nb] = current
                g[nb] = tentative
                f = tentative + h(nb, goal)
                heapq.heappush(open_heap, (f, tentative, nb))
    return None
```

Helpers I always end up writing:

```python
def neighbors4(grid, pos):
    w, h = len(grid[0]), len(grid)
    x, y = pos
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            yield (nx, ny)

def reconstruct(came_from, current):
    path = [current]
    while current in came_from:
        current = came_from[current]
        path.append(current)
    path.reverse()
    return path
```

## Learnings

- If you can’t **animate** your search, you’ll ship subtle off-by-one grid bugs forever.
- Visualization is a **test harness** for graph algorithms — not just pedagogy.
- Print statements lie; **spatial evidence** doesn’t.

I still reach for this pattern whenever I touch BFS/Dijkstra/A* again — the hour spent on drawing pays back immediately.
