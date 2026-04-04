---
title: "A* on a grid: tie-breaks and visible bugs"
date: "2025-10-16"
tags: ["experiments", "python", "algorithms"]
summary: "I have reimplemented A* several times. The bugs were never the priority queue API. They were diagonals, ties, and off-by-one walls. Drawing the frontier turned fuzzy wrong into obvious wrong."
reading_time: "5 min"
---

Pathfinding on paper is clean. Pathfinding in code picks up edge cases: 4-connected versus 8-connected moves, walls that share corners, priority queue entries that stale out when you relax a vertex twice. I use a minimal Python skeleton when I prototype, then add visualization so the open set growth tells the truth. IntelliPath was an excuse to animate search; the code I keep reusing is the small `astar` plus `neighbors4`. Everything else is domain glue: grid size, input format, rendering.

## Core loop, neighbors, reconstruction

```python
import heapq

def astar(grid, start, goal, h):
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

```python
def neighbors4(grid, pos):
    w, h = len(grid[0]), len(grid)
    x, y = pos
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            yield (nx, ny)
```

```python
def reconstruct(came_from, current):
    path = [current]
    while current in came_from:
        current = came_from[current]
        path.append(current)
    path.reverse()
    return path
```

I store `g` in a dict so revisiting a cell with a cheaper path overwrites cleanly. Some implementations allow duplicate heap nodes and ignore stale pops with a `closed` set; pick one strategy and stay consistent. Off-by-one on `w` and `h` shows up as paths that clip through the bottom row; tiny mazes in unit tests catch that faster than printf. I assert `start` and `goal` are walkable before searching. Logging `f`, `g`, and parent pointers for the first wrong goal hit usually points to a misplaced wall or reversed `y, x` order.

## Heuristics, ties, weighted grids, and memory

Manhattan distance is admissible for 4-neighbor grids with unit cost. If you allow diagonals with cost `sqrt(2)` or uniform diagonal cost, you must change the heuristic or you risk suboptimal paths depending on tie rules. **Write the connectivity choice in a comment above `neighbors*`** so future you does not mix modes.

When `f` values tie, pop order changes the shape of the search. I sometimes push `(f, g, x, y, node)` so smaller `g` wins ties and `x, y` stabilizes animation between runs; without that, dict iteration order noise makes debugging harder. For weighted graphs, replace `tentative = g[current] + 1` with edge weights and use a consistent heuristic with nonnegative reduced costs, or drop `h` and get Dijkstra. Duplicate nodes in the heap are acceptable if you ignore pops with stale `g` values; storing `g` in the tuple to compare after pop keeps teaching code simple.

`came_from` maps nodes to parents. For huge grids, packed integer keys `(y << 16) | x` work when bounds allow; tuples trade space for clarity. Jump point search and hierarchical grids are faster but harder to visualize; I keep A* as the baseline students can modify.

## Visualization, teaching, and input formats

When the frontier pokes into dead ends or oscillates, the bug is usually the heuristic or a wall check. Static prints of `g` values lie because they hide spatial structure; coloring cells by visit order does not. Pygame or matplotlib redraws the grid after each pop; slowing the loop with `time.sleep` makes expansion visible; fast mode disables sleep for benchmarks. Text files with `#` walls and spaces diff cleanly in git; I parse into nested lists once at load.

I freeze tiny mazes with known shortest path lengths; regression tests once caught a transposed `x, y` indexing bug. Students animate wrong heuristics quickly; the visual beats a five-minute chalk talk.

## After

If you only remember one thing: **admissible heuristics match your move set**, or you will ship subtle suboptimality.

The heap tuple shape `(f, g, x, y, node)` is ugly; it stopped nondeterministic screenshots in lecture slides. Students notice when the frontier looks different between runs on the same maze; that noise is a teaching bug.

Weighted grids connect cleanly to games with terrain costs. I keep the unweighted version in the repo as the reference implementation and layer weights in branches that need them so regressions have a simple baseline.

ASCII maze fixtures in git beat screenshots for diffs. When a student "fixes" a wall and the test maze changes shape, `git diff` tells the story without opening an image viewer.

I still print the final path length in the window title during demos. Audiences trust a number they can compare to Dijkstra on the same grid more than a pretty heatmap alone.
