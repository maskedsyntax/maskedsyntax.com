---
title: "SoundSnatch: TUI UX Over Raw yt-dlp"
date: "2025-11-02"
tags: ["devtools", "go", "tui", "yt-dlp"]
summary: "yt-dlp can do everything. My job was to make the happy path obvious and the failure path readable — Bubble Tea helped."
reading_time: "14 min"
---

I like `yt-dlp`. I don’t like memorizing twenty flags when I just want **this playlist** in **this folder** with a sane filename. SoundSnatch is a Bubble Tea wrapper — opinionated where it matters, transparent where it doesn’t.

## UX goals

- **Pick target** (URL) without thinking.
- **Pick folder** without typing paths if possible.
- Show **progress** that doesn’t spam scrollback.
- Surface errors as **human sentences**, not Python tracebacks.

## Data flow

```text
  URL field
     │
     ▼
  validate ──► queue jobs ──► spawn yt-dlp child
                    │              │
                    │              └── stream stderr/stdout
                    ▼
              progress Model ──► view
```

The model tracks rows: pending, running, done, failed.

## Why not shell out blindly?

Children can hang, formats can fail, networks flap. The TUI needs **structured status**:

```go
type Job struct {
    ID       string
    URL      string
    Status   string // human readable
    Progress float64
}
```

Rendering is just mapping structs to lipgloss blocks.

## Bubble Tea shape (simplified)

```go
type model struct {
    jobs   []Job
    cursor int
    err    string
}

func (m model) Init() tea.Cmd { return nil }

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "q":
            return m, tea.Quit
        case "enter":
            return m, startDownload(&m)
        }
    case progressMsg:
        m.jobs[msg.idx].Progress = msg.pct
    }
    return m, nil
}

func (m model) View() string {
    // lipgloss.JoinVertical + status rows
    return ""
}
```

`progressMsg` comes from a goroutine watching `yt-dlp` output — the TUI stays **single-threaded** for rendering.

## Learnings

- **Defaults** beat options — expose advanced flags behind an “Advanced” collapse, not the first screen.
- Streaming parser for yt-dlp output beats regexing everything — but a little regex is fine.
- Users blame the **UI** when downloads fail — show exit codes and last lines.

Still polishing keyboard nav — but the core bet stands: **respect the underlying tool**, don’t reimplement it.
