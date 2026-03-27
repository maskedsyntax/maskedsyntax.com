---
title: "BlockLite: Consensus Under Real Contention"
date: "2026-03-18"
tags: ["systems", "go", "blockchain", "concurrency"]
summary: "Toy blockchains are easy until your mining loop and your HTTP handler argue over the same map. Here's the boring mutex story that saved my sanity."
reading_time: "15 min"
---

![BlockLite State Flow](/images/blog/blocklite-state-flow.svg)

I built BlockLite because I wanted to **read** a blockchain implementation without drowning in production cruft. The surprise wasn’t consensus math — it was **concurrency**. The moment you add a mempool API and a mining goroutine, “just append blocks” stops being true.

## The failure mode I hit

Tests passed. Then I hammered `/tx` while mining and got:

- duplicate spends slipping through,
- heights that jumped backward in logs,
- rare panics that only showed up under `-race`.

Classic “shared mutable state without a story.”

## The fix I could explain to future me

One mutex around the **authoritative** chain + mempool state. Not elegant at scale — **honest** for a learning codebase.

```go
state.mu.Lock()
defer state.mu.Unlock()

state.Mempool = append(state.Mempool, tx)
```

Mining and API handlers both take the same lock. Throughput dies first — **correctness** doesn’t.

## How I think about the state machine

```text
           ┌──────────────┐
  submit ─►│   mempool    │
  tx       │  (pending)   │
           └──────┬───────┘
                  │ mine / validate
                  ▼
           ┌──────────────┐
           │ canonical    │
           │ chain tip    │
           └──────────────┘
```

Longest-chain resolution happens **after** you can trust single-threaded transitions.

## HTTP handler shape (Go)

Even toy chains have an API — keep it behind the same lock as everything else:

```go
func (s *Server) handleTx(w http.ResponseWriter, r *http.Request) {
    var tx Transaction
    if err := json.NewDecoder(r.Body).Decode(&tx); err != nil {
        http.Error(w, err.Error(), 400)
        return
    }
    s.state.mu.Lock()
    defer s.state.mu.Unlock()
    if err := s.state.AcceptTx(tx); err != nil {
        http.Error(w, err.Error(), 400)
        return
    }
    w.WriteHeader(204)
}
```

If `AcceptTx` fails, you didn’t half-mutate — the mutex scope keeps the story honest.

## Trade-offs I accept

| Choice              | Win                    | Loss                      |
|---------------------|------------------------|---------------------------|
| Big mutex           | Obvious invariants     | Contention under load     |
| Toy PoW             | Easy to reason about   | Not realistic hashrate    |
| No sharding         | Simple code            | Doesn't model real chains |

That’s fine. The goal was **deterministic behavior** I could print and step through.

## Learnings

- If you can’t explain the happens-before edges, you don’t understand your chain yet.
- `-race` is worth more than another micro-optimization pass.
- “Educational” still needs **real contention** — otherwise you learn the happy path only.

I still poke at nicer APIs (channels for announcements, cleaner separation), but the mutex-shaped umbrella was the first thing that made the chaos legible.
