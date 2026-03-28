---
title: "jvman exec: JAVA_HOME, PATH, then syscall.Exec"
date: "2026-02-26"
tags: ["devtools", "go", "shims", "tooling"]
summary: "Shell functions that tweak JAVA_HOME break the moment a child cwd differs. jvman resolves a JDK from .jvman, patches env, and replaces the process when POSIX allows."
reading_time: "5 min"
---

I switch Java versions often enough that editing `.zshrc` stopped scaling. The failure mode that pushed me over the edge was not "wrong JDK in this terminal." It was **Gradle spawning `java` from a cwd that never saw my shell function**, so the build used whatever happened to be first on PATH that day. jvman stores installed homes in JSON, resolves a version from a per-directory `.jvman` file or a global default, and exposes `jvman exec <version> <command>` so one-shot commands see the right world without wrapper scripts everywhere.

## Exec first, subprocess fallback

`runExec` loads config, maps the user version string to an installed entry, sets `JAVA_HOME`, prepends the JVM `bin` to `PATH`, then picks the binary: prefer `jvmBinDir/command`, else `exec.LookPath`. The happy path is `syscall.Exec`, which replaces the jvman process so signals and pgroups behave like you ran `java` directly. When the OS refuses replacement, the same env feeds `exec.Command` with inherited stdio.

```go
env := os.Environ()
env = updateEnv(env, "JAVA_HOME", jvm.Path)
env = prependPath(env, jvmBinDir)

var binary string
jvmBinary := filepath.Join(jvmBinDir, command)
if _, err := os.Stat(jvmBinary); err == nil {
    binary = jvmBinary
} else {
    found, lookErr := exec.LookPath(command)
    if lookErr != nil {
        return fmt.Errorf("command not found: %s", command)
    }
    binary = found
}

execErr := syscall.Exec(binary, append([]string{command}, commandArgs...), env)
if execErr != nil {
    execCmd := exec.Command(binary, commandArgs...)
    execCmd.Env = env
    execCmd.Stdin = os.Stdin
    execCmd.Stdout = os.Stdout
    execCmd.Stderr = os.Stderr
    return execCmd.Run()
}
```

## Shims versus exec

`jvman init` writes shims for `java`, `javac`, and friends into a dedicated bin dir you prepend to PATH. Shims share the resolver with `exec`; Gradle can spawn `java` without knowing jvman exists. `jvman exec` is for scripts and CI where you want an explicit version pin without installing a shim per entry point.

The resolver walks upward from `cwd` looking for `.jvman`, then falls back to global default. Deterministic beats clever. I keep installed paths absolute after `jvman install`; relative roots break the moment you `cd`.

## The Cobra line that mattered

`exec` disables flag parsing so `jvman exec 21 java -version` passes `-version` to Java, not to Cobra. Without that, you chase ghosts in issue trackers. `registry.New` reads the install map; `jvman install` unpacks Temurin builds into predictable folders. I avoid auto-scanning `/usr/lib/jvm` because vendor naming is chaos.

`updateEnv` replaces `JAVA_HOME` instead of stacking duplicates; `prependPath` dedupes the JVM bin segment. Ten copies of the same PATH entry is a debugging nightmare you only notice when something subtle misbehaves.

## Platforms and future

Unix is the first-class target. Windows paths and `syscall.Exec` differ; the fallback path exists because reality is messy. A `doctor` command and finer pins (`21.0.2` versus `21`) are wishlist items; the current surface stays small on purpose.

Printed `export PATH=...` helpers assume POSIX shells; Fish users translate. When a version is missing, the CLI suggests `install`, which sounds obvious until you watch yourself stare at a blank error.

`list` and `install` wrap downloading Temurin builds and registering them; network I/O stays out of `exec` so cold starts stay disk-bound. Resolution cost is JSON parse at startup, cheap next to JVM boot. I still refuse `os.Walk` over `/usr` in the hot path because that is how you accidentally ship a tool that feels fast on your machine and sluggish on NFS home dirs.

Tab completion belongs in shell snippets in the README, not in Go. Users type `21`, `temurin-21`, or build-specific labels depending on what `install` registered; alias normalization lives next to the registry so typos fail early with a useful list.

Network installs write predictable directory names so scripts can glob; I avoid cute folder labels that break automation the day you script a classroom lab.

## After

jvman is personal tooling published as reference. If you port it, test process replacement separately per OS. The Go fallback is not a compromise; it is admission that laptops are weird.

Reading the repo: start at `cmd/jvman/main.go` for Cobra wiring, then `internal/resolver` for lookup rules, then `internal/shim` for how files land under `~/.jvman/bin`. Tests sit beside packages with tiny fixture configs so behavior stays pinned without integration drama.

## Epilogue

The emotional arc of JDK tooling is boredom punctuated by panic. jvman is my attempt to make the boring part deterministic so the panic shows up in tests instead of at three a.m. when CI uses a different default Java than my laptop. If that sounds overdramatic, you have not watched Maven download the internet with the wrong bytecode target. The mismatch is the joke until it is your on-call shift.
