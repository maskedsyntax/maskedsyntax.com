---
title: "Focusbrew: Bubble Tea sessions in Go"
date: "2025-12-02"
tags: ["devtools", "go", "bubble-tea", "productivity"]
summary: "Pomodoro timers fail when state and time drift apart. Focusbrew is a small Bubble Tea app where the only clever bit is the fourth-session long break."
reading_time: "5 min"
---

Browser timers get lost behind tabs. Phone timers want permissions and ads. I live in terminals enough that a twenty-five minute block should live there too, without inventing impossible states. Pomodoro is not magic; it is a shared fiction that a visible clock makes procrastination slightly harder. I will take slightly harder. Focusbrew is Charm Bubble Tea, three durations, and a `SessionState` enum that maps cleanly to labels. The bar under the clock is lipgloss sugar; the discipline is **always keep `duration` and `timeLeft` coherent** so percent math cannot lie.

## What "simple" actually means

Classic Pomodoro is work, short break, long break every fourth round. I encoded that as an int enum with a `String()` method so the view and help text share one source of names. The model holds work, short, and long durations, the active `duration` and `timeLeft`, a running flag, `sessionCount`, and a `progress` bubble from the bubbles package for the gradient bar.

CLI flags set minutes for each phase so I can match how a team runs without recompiling. Defaults are the usual twenty-five / five / fifteen. On deep-focus days I run `--work 50`; the same state machine does not care.

## The update loop is the whole program

Keys are deliberately boring: `s` starts when idle, `p` pauses, `r` resets, `n` advances phase, `q` or ctrl+c quits. Ticks arrive once per second. When time hits zero I print `\a` and stop running until I explicitly advance or reset. That matches how I actually behave: I want the bell, then I want to stand up before the next block starts.

```go
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "q", "ctrl+c":
            return m, tea.Quit
        case "s":
            if !m.running && m.timeLeft > 0 {
                m.running = true
                return m, tick()
            }
        case "p":
            m.running = false
        case "r":
            m.resetTimer()
        case "n":
            m.nextSession()
        }
    case tickMsg:
        if m.running && m.timeLeft > 0 {
            m.timeLeft -= time.Second
            percent := 1.0 - (float64(m.timeLeft) / float64(m.duration))
            cmd := m.progress.SetPercent(percent)
            return m, tea.Batch(tick(), cmd)
        } else if m.running && m.timeLeft <= 0 {
            m.running = false
            m.progress.SetPercent(1.0)
            fmt.Print("\a")
        }
    }
    return m, nil
}

func (m *model) nextSession() {
    m.running = false
    if m.state == StateWork {
        m.sessionCount++
        if m.sessionCount%4 == 0 {
            m.state = StateLongBreak
            m.duration = m.longBreakDuration
        } else {
            m.state = StateShortBreak
            m.duration = m.shortBreakDuration
        }
    } else {
        m.state = StateWork
        m.duration = m.workDuration
    }
    m.timeLeft = m.duration
    m.progress.SetPercent(0)
}
```

The modulo on `sessionCount` is the only "smart" behavior. Everything else is explicit transitions. I drew the focus graph on paper once when adding a modal-ish idea; Bubble Tea will happily let you encode illegal focus unless you stop it.

`tea.WindowSizeMsg` clamps the progress width so narrow terminals do not wrap into nonsense; wide screens cap around eighty columns so the block stays centered. Styling lives in package-level lipgloss vars so tweaking palette does not mean hunting literals through `View`.

## Why tests are manual

Bubble Tea under `go test` without a fake tty is more ceremony than this project deserves. I keep a short checklist before tags: start, pause, reset, skip phase, resize. The binary is small enough that "run it" remains the fastest test.

`tea.NewProgram` handles alt-screen and signal forwarding; quitting returns the terminal to a sane state. Some hosts mute `\a` entirely, so the bell is a best-effort nudge, not a contract. I have considered a subtle OSC sequence later; the Pomodoro purists I know are split on whether silence is a feature.

`go build` emits a static binary; there are no embedded assets yet beyond what the standard library gives you. That keeps packaging honest for ssh sessions where you copy one file and run.

Long breaks every fourth round match the textbook Pomodoro recipe. Teams that hate the long break can shorten it with `-long`; the state machine does not care about the moral argument, only the `time.Duration`.

Red lipgloss for work and green for breaks is a cheap cognitive aid: your peripheral vision learns the mode before you read the label. I keep the help line at the bottom tiny so it does not compete with the timer. Locale stays ASCII for minutes and seconds so copy-paste into tickets does not surprise anyone.

## After

Focusbrew is under a few hundred lines of real logic. The line I repeat in my head is: **never track only remaining seconds** without the total duration you need for the bar. The `progress` bubble and `timeLeft` disagree the moment those drift.
