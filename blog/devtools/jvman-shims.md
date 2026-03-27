---
title: "jvman: Shims as an Interface"
date: "2026-02-26"
tags: ["devtools", "go", "shims", "tooling"]
summary: "I kept installing the wrong JDK for projects. Shims turned out to be the smallest thing that actually fixed my muscle memory."
reading_time: "14 min"
---

I work on a bunch of repos that expect different Java versions. For a while my fix was “change `JAVA_HOME` and open a new terminal,” which sounds fine until you do it forty times a week. I wanted something that felt like **nvm** or **pyenv**: type `java`, get the right binary, no ceremony.

This post is the messy middle — not a spec, just what I tried and what stuck.

## The thing that was broken

PATH fights you. You either prepend a single JDK forever, or you maintain shell snippets per project. Both scale badly. The real requirement is: **every invocation** of `java` (and friends) should consult “what does *this* directory want?”

## Shims, in one breath

A shim is a tiny executable on PATH with the same name as the real tool. It doesn’t *contain* the JDK — it **resolves** which JDK to run, then `exec`s it.

```text
  you type          shim does                    OS runs
  -------          ---------                    -------
  java    -->   read .jvman / global config  -->  real java 17
  javac   -->   same resolution            -->  real javac 17
```

The mental model I keep in my head:

```text
        ┌─────────────┐
        │  jvman shim │  (always on PATH)
        └──────┬──────┘
               │ lookup
       ┌───────┴────────┐
       ▼                ▼
  ~/.jvman.json    ./.jvman
  (default)        (project override)
       │                │
       └───────┬────────┘
               ▼
        ┌──────────────┐
        │ exec $JAVA/  │
        │ bin/java     │
        └──────────────┘
```

## Why not shell aliases?

Aliases don’t compose across subprocesses the way people expect. Build tools spawn `java` directly. A shim is just another binary — **Gradle doesn’t care** that it’s indirect.

## The boring performance bit

The shim must be **fast**. Not “Rust fast” — *bash startup* fast. A few ms is fine; tens of ms and your shell feels sluggish.

Rough shape in Go (pseudocode):

```go
func main() {
    target := resolve(os.Args[0]) // java, javac, jar, ...
    jdk := loadConfig(wd())
    binary := filepath.Join(jdk.Home, "bin", target)
    syscall.Exec(binary, os.Args, envFor(jdk))
}
```

No logging in the hot path. No network. Cache anything you parse from disk if you can.

## Config on disk (shape)

I keep installs explicit — no magic scanning in the hot path:

```json
{
  "default": "21",
  "jdks": {
    "21": "/home/me/.jdks/temurin-21",
    "17": "/home/me/.jdks/temurin-17"
  }
}
```

Project override is literally a `.jvman` file next to `pom.xml` / `build.gradle` with `{ "java": "17" }`. Resolution walks up directories until it finds one — same mental model as **nvm**.

## What I got wrong at first

I tried to be clever with lazy discovery of JDKs. Clever means I/O on every call. The fix was aggressively boring: **known install roots**, explicit `jvman use`, and treat ambiguity as an error instead of guessing.

## Learnings I still believe

- Shims are an **interface** between human intent (“this project uses 21”) and the OS (`exec`).
- If resolution isn’t deterministic, people stop trusting the tool.
- “Fast enough” is measured in **felt latency**, not benchmarks — same reason a slow `cd` hook drives people nuts.

I’m still iterating on edge cases (Windows path quirks, toolchains that hardcode `JAVA_HOME`), but the core bet — **shim as the narrow waist** — hasn’t changed.
