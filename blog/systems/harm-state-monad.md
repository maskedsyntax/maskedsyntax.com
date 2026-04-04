---
title: "HARM: ARM7 stepping as a pure state machine"
date: "2025-11-26"
tags: ["systems", "haskell", "emulation"]
summary: "HARM is a Haskell ARM7 toy: parse assembly, build an instruction map, resolve labels, then run `runProgram` from a fixed initial CPU. Purity makes CPU state easier to trace while the emulator comes together."
reading_time: "5 min"
---

I started HARM because printf-heavy C cores made it hard to answer "what should the flags be after this one instruction?" Haskell will not fix ARM semantics for you. It does force an explicit `CPUState` through each step so I cannot "accidentally" reuse a stale register behind my back.

## From source file to resolved instruction map

`runFile` reads text, parses each line into `LineContent`, assembles a `Map` from address to `Instruction`, resolves labels, then runs `runProgram` and prints registers.

```haskell
runFile path = do
    content <- readFile path
    let lines' = lines content
    let parsed = map parseLineContent lines'
    case sequence parsed of
        Left err -> putStrLn $ "Error parsing file:\n" ++ err
        Right contents -> do
            let (instMap, labelMap) = assemble contents
            let resolvedInstMap = Map.map (resolveLabels labelMap) instMap
            finalState <- runProgram resolvedInstMap initCPU
            printRegisters finalState
```

`assemble` walks the source once, increments the simulated PC by four per instruction (ARM word size in this teaching subset), and records label positions when a line is just a symbol.

```haskell
assemble :: [Maybe LineContent] -> (Map.Map Word32 Instruction, Map.Map String Word32)
assemble contents = go 0 Map.empty Map.empty contents
  where
    go _ insts labels [] = (insts, labels)
    go addr insts labels (Nothing : rest) = go addr insts labels rest
    go addr insts labels (Just (LLabel name) : rest) =
        go addr insts (Map.insert name addr labels) rest
    go addr insts labels (Just (LInstruction inst) : rest) =
        go (addr + 4) (Map.insert addr inst insts) labels rest
```

Branches can mention label text. After the first pass knows every address, `resolveLabels` rewrites to concrete immediates or calls `error` with a clear string. I prefer hard `error` during assembly over executing into nonsense.

```haskell
resolveLabels labels (B cond (TLabel name)) =
    case Map.lookup name labels of
        Just addr -> B cond (ImmAddr addr)
        Nothing -> error $ "Undefined label: " ++ name
```

## Execution: pure steps, thin IO, condition codes

The execute module defines what one instruction does to `CPUState`. I keep IO devices thin: the core is pure, and `runProgram` sequences steps in `IO` only where the syllabus needs syscalls or logging. The monad stack changed a few times; the invariant did not: **fetch, decode, execute** is always "take state, produce state."

```haskell
checkCondition :: Flags -> Condition -> Bool
checkCondition flags cond = case cond of
    AL -> True
    EQ' -> zFlag flags
    NE -> not (zFlag flags)
    CS -> cFlag flags
    CC -> not (cFlag flags)
    MI -> nFlag flags
    PL -> not (nFlag flags)
    -- ...
```

Keeping ALU and memory helpers pure means QuickCheck-style properties can compare against a reference simulator for opcodes I trust.

HARM is still a teaching core: ARM7 subset for coursework (data processing, branches, loads and stores we needed for labs). Flat word-addressed memory with a simple MMIO stub for UART-style I/O in advanced labs. Not cycle-accurate to any particular silicon; undefined opcodes stop with a clear error instead of silent drift.

## Workflow: parser, tests, REPL, packaging

`Parser.hs` accepts a small assembly syntax with labels and immediates; error messages include line numbers because students paste fifty-line files. `test.asm` and `hello.asm` are golden programs; after changing decode I rerun `harm test.asm` and diff register dumps. Running `harm` without arguments drops into a read-eval loop over single instructions for micro-step debugging. `harm.cabal` lists dependencies; Stack or cabal both work; README documents minimum GHC when it matters.

When flags disagree with QEMU, I diff register snapshots at the same PC. With mutable globals that workflow felt like archaeology. With a pure `step`, I re-run from the same snapshot until the divergence shrinks to a single opcode. For tough bugs I single-step beside QEMU with the same binary to see whether decode or execute is wrong.

If you clone it, start at `Parser.hs` for syntax sugar, then `Execute.hs` for semantics. `Main.hs` is glue you could replace with a test harness once the maps look right.

## After

The Haskell shell is why I still open the repo: assembly stays data, state stays explicit, and the type checker complains when I extend `Instruction` without updating decode.

Teaching with HARM meant students could diff their register dump against mine byte for byte when the program was wrong. With a mutable C core, "it works on my machine" hid uninitialized state for longer than anyone admitted.

I do not claim HARM is a fast emulator. It is a legible one. Performance would mean another codebase; correctness and explainability were the whole point of the exercise.
