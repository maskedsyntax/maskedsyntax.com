---
title: "Focusbrew: A State Machine for Session Tracking"
date: "2025-12-02"
tags: ["devtools", "state-machine", "productivity"]
summary: "Pomodoro timers fail when you half-finish states. I drew explicit transitions and suddenly the bugs got boring."
reading_time: "13 min"
---

Focusbrew started as “track focus blocks” and almost immediately acquired **illegal states**: break running while work timer says paused, negative seconds, double starts. The UI looked fine — the **model** was lying.

## Explicit beats implicit

I listed legal modes on paper first:

```text
        ┌─────────┐
 start  │ IDLE    │
───────►│         │
        └────┬────┘
             │ begin_work
             ▼
        ┌─────────┐   pause    ┌──────────┐
        │ WORKING │──────────►│ PAUSED   │
        └────┬────┘            └──────────┘
             │ complete_round
             ▼
        ┌─────────┐
        │ BREAK   │
        └─────────┘
```

Anything not on the diagram is a **bug**, not a feature.

## Encoding in code

Instead of scattered booleans:

```text
BAD:  is_running && is_break && paused  // impossible combos exist
GOOD: enum Session { Idle, Work(WorkState), Break(BreakState) }
```

Transitions become **exhaustive matches** — the compiler nags you.

## Rust-shaped sketch

```rust
#[derive(Clone, Debug)]
enum Phase {
    Idle,
    Work { started: Instant, target: Duration },
    Break { started: Instant, target: Duration },
}

#[derive(Clone, Debug)]
enum Event {
    StartWork,
    Pause,
    Resume,
    FinishRound,
    Tick,
}

fn transition(phase: Phase, ev: Event) -> Option<Phase> {
    use Phase::*;
    use Event::*;
    match (phase, ev) {
        (Idle, StartWork) => Some(Work {
            started: Instant::now(),
            target: Duration::from_secs(25 * 60),
        }),
        (Work { .. }, Pause) => Some(Idle), // or a dedicated Paused carrying Work snapshot
        (Work { .. }, FinishRound) => Some(Break {
            started: Instant::now(),
            target: Duration::from_secs(5 * 60),
        }),
        _ => None,
    }
}
```

`None` means **illegal transition** — easier to debug than silent corruption.

## Time as derived state

Store **deadline** or **started_at + duration**, not “remaining seconds” as authority — avoids drift and makes pause/resume **idempotent**.

## Learnings

- Session UX is a **protocol** problem. Draw the protocol before pixels.
- Users forgive ugly UI; they don’t forgive timers that lie.
- Tests love pure transition functions: `next(state, event)`.

The app is still small — but the state machine diagram is the doc I actually reread.
