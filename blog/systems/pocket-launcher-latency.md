---
title: "Pocket: Launcher Latency on Cold Start"
date: "2025-11-14"
tags: ["systems", "cpp", "gtk", "linux"]
summary: "I wanted a launcher that feels instant on old hardware. Profiling showed I was paying for work I didn't need on every keypress."
reading_time: "13 min"
---

Application launchers live or die on **felt latency**. Pocket targets minimalist Linux setups — which often means **older laptops** and spinning rust. My first builds were “fast enough” on my dev machine and **embarrassing** elsewhere.

## What cost time

- Scanning `PATH` too eagerly.
- Building icon caches **inline** with search.
- Allocating fresh strings per keystroke instead of **reusing** buffers.

## Architecture sketch

```text
 keypress
    │
    ▼
 filter candidates (cheap)
    │
    ▼
 score + sort
    │
    ▼
 render top N only
```

Never render 10k entries — render **what fits**.

## GTK reality

Main thread does UI — offload disk scans carefully. A background indexer with a **read-only snapshot** beats blocking `readdir` on every open.

## Profiling tools that helped

```bash
# rough idea — perf + flamegraphs, or GTK inspector for idle stalls
perf record -g -- ./pocket
```

## C++: keeping search cheap

```cpp
// Pseudocode — std::vector<std::string> candidates preloaded once
std::vector<const Entry*> filter(const std::string& query) {
    std::vector<const Entry*> out;
    out.reserve(32);
    for (const auto& e : index) {
        if (matches(e.name, query))
            out.push_back(&e);
        if (out.size() >= 50) break; // cap for UI
    }
    return out;
}
```

The **index** is rebuilt when apps change — not on every keystroke.

## Learnings

- **Cold start** matters as much as steady-state — measure both.
- Debounce filesystem watchers — editors create storms of events.
- Simple UIs win when the core loop is **tight**.

Pocket is still small — but the performance mindset stuck: **measure on slow machines**, not your M-series dev box.
