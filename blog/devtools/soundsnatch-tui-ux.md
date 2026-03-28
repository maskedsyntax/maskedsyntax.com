---
title: "SoundSnatch: yt-dlp JSON behind Bubble Tea"
date: "2025-11-02"
tags: ["devtools", "go", "tui", "yt-dlp"]
summary: "Shell aliases around yt-dlp rot. SoundSnatch is the UI layer: JSON in, human errors out, downloads without me relearning flags every quarter."
reading_time: "5 min"
---

I used to wrap `yt-dlp` in shell aliases for "just give me mp3." Upstream changed defaults often enough that my muscle memory lied. The real pain was not the flags themselves. It was discovering I had pasted a **playlist** after the download started, or that a site wanted cookies, or that stderr was screaming while stdout still held a usable JSON blob. SoundSnatch is a small Charm Bubble Tea app whose job is to **show title and duration before bytes move**, then get out of the way.

## Structured fetch is the contract

`yt-dlp -J` is the spine. `fetchInfoCmd` tries the `yt-dlp` binary on PATH, then falls back to `python3 -m yt_dlp` when people only installed the module. Args include quiet flags, `--flat-playlist`, optional `--cookies-from-browser` when the model stores a browser name.

```go
cmd := exec.Command("yt-dlp", args...)
if _, err := exec.LookPath("yt-dlp"); err != nil {
    cmd = exec.Command("python3", append([]string{"-m", "yt_dlp"}, args...)...)
}
```

Parsing is deliberately forgiving: stdout and stderr fill buffers, then **JSON wins over exit code**. `yt-dlp` often exits non-zero while still printing an object because it hated one format line.

```go
runErr := cmd.Run()
outStr := strings.TrimSpace(stdout.String())

if outStr != "" {
    var info map[string]interface{}
    if err := json.Unmarshal([]byte(outStr), &info); err == nil {
        title, _ := info["title"].(string)
        durFloat, _ := info["duration"].(float64)
        return infoFetchedMsg{
            title:    title,
            duration: durFloat,
        }
    }
}

if runErr != nil {
    errMsgStr := strings.TrimSpace(stderr.String())
    if errMsgStr == "" {
        errMsgStr = runErr.Error()
    }
    return errMsg{err: fmt.Errorf("could not fetch info: %s", errMsgStr)}
}

return errMsg{err: fmt.Errorf("could not fetch info: no output from yt-dlp")}
```

Search uses the same resolver pattern: `ytsearch5:` with newline-delimited JSON objects fed into a bubbles list. I do not pretend stderr is structured. Title and duration from `-J` are stable; anything I might parse from live download output is best-effort and version-sensitive.

## Bubble Tea because blocking draw is rude

`main` uses `tea.WithAltScreen()`. Long subprocess work returns messages into `Update` instead of holding the render goroutine hostage. `ui.go` owns the model: URL and path inputs, search lists, spinner states, `stateFetching`, `stateSearching`, `stateDownloading`, plus file-picker flows. Each state picks which sub-model eats keys first so the URL field does not swallow input mid-download.

Users blame the TUI when a site breaks. Showing stderr tails and exit codes in the status line turned vague "it is broken" reports into "upstream changed" reports. Debug builds can log argv; release builds stay quiet so pasted URLs do not land in shared scrollback.

## Cookies, formats, packaging

Membership sites need `--cookies-from-browser`; I surface browser choice in settings instead of hardcoding Chrome. After metadata fetch, format lists come from follow-up queries; caching per URL is future work. Disk full errors bubble from the child with the path that failed. README states ffmpeg is out of scope; binaries assume `yt-dlp` or Python plus `yt_dlp`.

`main_test.go` only covers small URL helpers. The rest is manual when major `yt-dlp` versions ship. That is the honest maintenance cost of wrapping a moving target.

Lipgloss styles match my other Charm apps on purpose: muscle memory for borders and padding beats novelty when you hop between tools in one session. Help text at the bottom of `View()` lists the few global shortcuts so discoverability survives the gap between uses. Bubble list widgets own arrows for results, formats, and browser pickers; text inputs keep typing until you tab away.

`downloader.go` isolates subprocess invocation from `Update`; `types.go` keeps message structs small so refactors do not ripple through half the repo. Progress updates stay coarse because line-by-line stderr parsing rots across releases. I would rather under-promise smooth progress than ship a parser that breaks every Tuesday.

## After

SoundSnatch admits **yt-dlp owns the protocol**. My code owns spawning, parsing, and presenting. When JSON fields shift, I adjust `map` access or structs. That is still cheaper than reimplementing extractors and playing whack-a-mole with site changes.

I keep returning to this tool when I want defaults without nested option screens. Paste URL, confirm metadata, pick output folder, walk away. The TUI is not the product; **fewer wrong downloads** is the product. Everything else is Charm plumbing and stubborn error strings.

## Epilogue

If you build something similar, budget time for upstream churn. The UI will look stable while the extractor layer moves underneath. That is the bargain you sign when you stop writing shell one-liners and start shipping a face for someone else's engine.

I still reach for plain `yt-dlp` when scripting batch jobs; SoundSnatch is for the interactive path where confirmation saves embarrassment. Same engine, different stakes.
