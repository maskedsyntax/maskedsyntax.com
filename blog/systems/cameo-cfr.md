---
title: "Cameo: CFR Decompilation for Reading JVM Bytecode"
date: "2025-11-08"
tags: ["systems", "java", "bytecode"]
summary: "I got lost in ASM trees until I let CFR print Java-ish output. Reading decompiled code isn't cheating — it's a map."
reading_time: "12 min"
---

When I’m spelunking JVM bytecode — obfuscated or not — staring at raw opcodes burns brain cells. **CFR** (and friends) produce **almost** source-shaped output that’s faster to scan than a class file dump.

## Workflow I actually use

```text
.class ──► CFR ──► pseudo-Java
   │                    │
   └── javap for        └── trace logic, find calls,
       quick constants      then dive ASM if needed
```

## Why not only ASM?

ASM is precise for **transforms**. For **understanding**, higher-level structure helps — until it lies about control flow. You learn to cross-check.

## Commands I actually run

Quick disassembly without firing up an IDE:

```bash
javap -classpath app.jar -c com.example.Thing | sed -n '1,80p'
```

When I need constants and signatures, verbose mode:

```bash
javap -v -classpath app.jar com.example.Thing | less
```

CFR from the CLI (jar on classpath):

```bash
java -jar cfr.jar com/example/Thing.class --outputdir out/
```

Then I read `out/com/example/Thing.java` like normal source — still wrong sometimes, but **navigable**.

## Reading bytecode vs reading CFR side by side

JVM opcodes for a simple getter look like noise:

```text
0: aload_0
1: getfield #2 // Field x:I
4: ireturn
```

CFR might literally print `return this.x;`. That’s the win: I grep for **call sites** and string literals first, then drop to bytecode when the decompiler invents a control-flow edge that doesn’t exist.

## Footguns

- Decompilers invent variable names — **meaning** isn’t preserved.
- Inline optimizations confuse reconstructors — read with skepticism.
- Legal/ethical boundaries matter if you’re not looking at **your** code.

## Learnings

- Tools that shorten the loop from **bytes → intent** are worth gold.
- Pair decompiler output with **small reproducible inputs** — diff behavior, don’t trust prose.
- Sometimes `javap -v` is still the fastest answer for one constant.

Cameo (my wrapper experiments) is mostly glue — the lesson is **lean on great decompilers**, then go precise where it matters.
