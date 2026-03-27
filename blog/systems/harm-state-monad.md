---
title: "HARM: Modeling CPUs as Pure State Transforms"
date: "2025-11-26"
tags: ["systems", "haskell", "emulation"]
summary: "Writing an ARM7 emulator in Haskell felt silly until debugging became 'replay the state transition' instead of 'grep the globals'."
reading_time: "15 min"
---

Emulators tempt you toward **giant structs** and `mut` everywhere. It works until you hit a bug where `CPSR` flags disagree with your mental model and you’re printf-debugging **hundreds** of instructions.

HARM was my attempt to keep the CPU core **pure**: `State -> Instruction -> State` (modulo I/O edges).

## The shape

```text
fetch ──► decode ──► execute ──► update PC / flags
                         │
                         └── optional memory side effects
```

In Haskell, bundling registers + memory into a single `CPUState` means the type checker yells when you forget a field update.

## State monad (practically)

You can thread state manually:

```haskell
step :: CPUState -> (CPUState, SideEffects)
```

Or use `StateT` when you want sequencing without noisy plumbing. The **idea** matters more than the exact abstraction: **one instruction = one transition**.

## A toy decode step (illustrative)

Not the real ARM table — just the shape that helped me think:

```haskell
import Data.Bits (shiftR, (.&.))

data Instruction = Add Reg Reg Reg | Mov Reg Imm | Branch Cond Offset

decode :: Word32 -> Maybe Instruction
decode w
  | opBits == 0x00 = Just (Add r1 r2 r3)
  | opBits == 0x01 = Just (Mov r1 imm)
  | otherwise      = Nothing
  where
    opBits = w .&. 0xff
    r1 = fromIntegral ((w `shiftR` 8) .&. 0xf)
    -- ...
```

If `decode` returns `Nothing`, I stop **before** execution — the PC trail stays clean.

## Debugging wins

When something breaks:

```text
BAD:  "somewhere in the last million cycles..."
GOOD: "instruction X at PC=Y produced illegal flag Z"
```

You can snapshot `CPUState` and **diff** expectations.

## Learnings

- Purity isn’t virtue signaling — it’s **replayability**.
- IO devices still need escape hatches; keep them **thin**.
- Haskell performance is fine for learning-scale cores; optimize after correctness.

I’m still wiring more ARM features, but the functional shell is why I haven’t rage-quit.
