---
title: "pulsefetch: shaping a system fetcher in Go"
date: "2025-09-30"
tags: ["systems", "go", "cli", "linux"]
summary: "Neofetch is great until you want to change it. pulsefetch is the same screenshot habit with a codebase I can grep."
reading_time: "5 min"
---

I like neofetch output in screenshots. I do not like editing a thousand-line shell script when Debian changes where GPU strings live. pulsefetch is Go, gopsutil for most facts, a few small `exec` helpers where vendors lie creatively, and lipgloss for alignment. Image mode exists because it is fun; **text mode is the contract** I expect to work over SSH, in tmux, and on old VTE.

Early versions inlined everything in `main`. The first time I added a toggle and scrolled five hundred lines, I split the tree. The architecture is intentionally dull: load config, fetch structured info, render.

## Thin main on purpose

`main` wires three steps. That keeps failure modes obvious: bad config path, partial fetch errors, render quirks. Adding a field means extending `SystemInfo`, config, and the render list, almost never `main.go` again.

```go
cfg, err := config.LoadConfig()
if err != nil {
    fmt.Fprintf(os.Stderr, "Error loading config: %v\n", err)
    os.Exit(1)
}

info, err := fetcher.Fetch(cfg)
if err != nil {
    fmt.Fprintf(os.Stderr, "Error fetching system info: %v\n", err)
    os.Exit(1)
}

logo := ui.GetLogo(cfg, info)
ui.Render(cfg, info, logo)
```

`fetcher.Fetch` fills structs field by field. gopsutil covers host, CPU, memory, disk, network in one place. Booleans from config gate expensive probes so you do not spawn subprocesses for stats you disabled.

```go
h, err := host.Info()
if err == nil {
    info.Hostname = h.Hostname
    if cfg.ShowOS {
        info.OS = fmt.Sprintf("%s %s", h.Platform, h.PlatformVersion)
    }
    if cfg.ShowKernel {
        info.Kernel = h.KernelVersion
    }
    if cfg.ShowUptime {
        d := time.Duration(h.Uptime) * time.Second
        info.Uptime = formatDuration(d)
    }
}
```

When resolution or GPU strings need shelling out, helpers stay private next to `Fetch` so `SystemInfo` remains the UI contract. Blank values skip cleanly; a broken GPU probe should not blank the whole panel.

## Text first, image as party trick

Text rendering builds rows, pads keys to the longest label, and applies lipgloss styles. That gives alignment without hand-counting spaces per line. Image mode prints art, walks the cursor up with ANSI, then indents info lines so text sits beside the logo. It is fiddly and terminal-dependent; I treat breakage reports as expected, not regressions against perfection.

Config loads from `~/.config/pulsefetch/pulsefetch.toml` with `/etc/pulsefetch/pulsefetch.toml` as fallback. Viper defaults mean missing files still yield a sane profile; `mapstructure` tags keep snake_case TOML aligned with Go fields. Adding a toggle means field, default, and one more row in `Render`, which stops the slow drift where config and UI disagree.

Image mode prints the logo string, counts newlines, then uses cursor-up and column-shift ANSI so text lands beside art. Font metrics and sixel support vary wildly; I treat failures as "turn off `image_path`" rather than endless terminal detection. `ui/logo.go` picks ASCII or image assets from config and falls back when files go missing so first runs still show something.

```go
fmt.Print(logo)
logoHeight := strings.Count(logo, "\n")
if logoHeight > 0 {
    fmt.Printf("\033[%dA", logoHeight)
}
lines := strings.Split(infoBlock, "\n")
for _, line := range lines {
    fmt.Printf("\033[%dC%s\n", 42, line)
}
```

README documents apt setup for Debian-based installs; `go build ./cmd/pulsefetch` stays the contributor path. Automated tests lean on config parsing and render helpers that avoid dumping raw ANSI in CI logs.

Pad-to-column rendering for text rows is the quiet win: compute `maxKeyLen`, repeat spaces, then lipgloss styles for keys and values so columns line up without manual counting on every new field. When someone asks for a new stat, I add one struct field and one `infoItem`, not a layout rewrite.

Friends paste dotfiles in gists; the TOML shape stays stable enough that merging configs does not feel like resolving a YAML nightmare. That social proof matters more to me than feature count.

Some fields still shell out because vendors expose human-readable GPU strings and package counts that gopsutil does not normalize. I keep those probes small and cached per run so a slow `lspci` does not run on every frame of a hypothetical future TUI version.

Cross-distro manual runs are still the best test suite for image alignment: font width bugs do not show up in unit tests that strip ANSI.

## After

I still run it after distro upgrades as a quick check that WM, resolution, and theme detection match what my eyes see. For a small CLI, that loop is the whole point. If you fork the idea, keep `Fetch` honest about partial errors and let the UI skip empty strings. Everything else is polish, and image mode will always be a little broken on someone else's terminal. That is fine as long as text mode stays boring and reliable.
