---
title: "Pocket: GTK launcher, desktop files, and filter cost"
date: "2025-11-14"
tags: ["systems", "cpp", "gtk", "linux"]
summary: "Pocket is a small Gtkmm launcher. Most of the latency story is when you rescan versus when you filter, and how much work happens per keystroke."
reading_time: "5 min"
---

I wanted a launcher that matches my monospace-heavy desktop: borderless window, search entry on top, list below, Escape to hide. Pocket does that with Gtkmm 3. The performance story is not micro-optimizations in string compares. It is **separating indexing from filtering** so opening the launcher does not re-walk `/usr/share/applications` on every keypress.

## Where apps live and how startup works

Search paths are a fixed vector covering distro packages, local installs, Snap, and Flatpak export trees. Pocket should see the same entries your desktop menu sees without you hand-configuring XDG. If your distro hides apps elsewhere, add a path and recompile; I kept it compile-time on purpose to avoid another config format.

```cpp
const std::vector<std::string> m_app_dirs = {
    "/usr/share/applications",
    "/usr/local/share/applications",
    Glib::get_home_dir() + "/.local/share/applications",
    "/var/lib/snapd/desktop/applications",
    Glib::get_home_dir() + "/.local/share/flatpak/exports/share/applications",
    "/var/lib/flatpak/exports/share/applications"};
```

The constructor loads `~/.config/pocket/pocketrc` if it exists (simple `key: value` lines), applies CSS for the dark panel, wires `signal_changed` on the entry to `on_entry_changed`, then calls `load_applications()` **once**.

```cpp
m_entry.signal_changed().connect(sigc::mem_fun(*this, &PocketLauncher::on_entry_changed));
load_applications();
show_all_children();
```

`load_applications` walks configured dirs, parses `.desktop` files, sorts `m_all_apps` by name, then calls `filter_apps()` to seed the list.

```cpp
void PocketLauncher::load_applications() {
    for (const auto& dir : m_app_dirs) {
        if (std::filesystem::exists(dir))
            scan_directory(dir);
    }
    std::sort(m_all_apps.begin(), m_all_apps.end(),
              [](const AppInfo& a, const AppInfo& b) { return a.name < b.name; });
    filter_apps();
}
```

## Parsing desktops, filtering on each key, launching

`parse_desktop_file` only cares about `[Desktop Entry]`. It skips comments, reads `Name`, `Exec`, `Icon`, bails on `NoDisplay` or `Hidden`, and strips field codes from `Exec` (`%f`, `%u`, etc.) so `std::system` does not see malformed tails. That keeps dependencies small at the cost of ignoring MIME associations and actions; Pocket only needs a runnable command and a label.

`on_entry_changed` calls `filter_apps`, which clears the `Gtk::ListStore` and rebuilds visible rows from `m_all_apps`. For each match it resolves icons through the theme or disk with a fallback to `application-x-executable`. Yes, each keypress reallocates list rows and hits the icon theme; for a few hundred apps that stayed fine on hardware I use. If it chugs, reach for **a filtered index** or a pixbuf cache per icon name before micro-optimizing `tolower`. I measured before doing that; the simple version won.

```cpp
void PocketLauncher::filter_apps() {
    std::string search_text = m_entry.get_text();
    std::transform(search_text.begin(), search_text.end(), search_text.begin(), ::tolower);

    m_list_store->clear();

    for (const auto& app : m_all_apps) {
        std::string app_name_lower = app.name;
        std::transform(app_name_lower.begin(), app_name_lower.end(), app_name_lower.begin(),
                       ::tolower);

        if (search_text.empty() || app_name_lower.find(search_text) != std::string::npos) {
            auto row = *(m_list_store->append());
            row[m_col_name] = app.name;
            row[m_col_exec] = app.exec;
            // ... icon lookup ...
        }
    }
}
```

Activation appends ` &` and calls `std::system`, matches how `.desktop` `Exec` lines are written, then hides the window. `pocket.h` declares `AppInfo` and list columns; keeping `Gdk::Pixbuf` refs avoids reloading every frame when possible.

## Config, window chrome, safety, and future ideas

`load_config` reads `key: value` into a map; font family and size flow into CSS via `Gtk::CssProvider`. Invalid CSS throws; I print to stderr and continue with defaults. The window is undecorated, always-on-top, skip taskbar: overlay launcher behavior. Focus follows map so typing starts immediately after hotkey. `on_key_press_event` hides on Escape; you can keep the process resident if a global hotkey daemon maps to show/hide. I usually exit from the window manager script instead.

`std::system` with `Exec` from package paths is only safe on machines where I trust those files; sandboxed installs would need tighter validation. Makefile links gtkmm and threads; this tree targets Gtkmm 3. Fuzzy matching and `fzf`-style scoring would need scoring structs instead of substring `find` on lowercase names; memory of frequent picks could live in another small state file.

## After shipping

Pocket is intentionally small. The lesson I kept is architectural: **pay for directory scans at startup or explicit refresh**, not on every keypress. If you fork it, add a manual rescan key before watchers on `/usr/share/applications`; package manager churn can surprise you if you index too eagerly.

Flatpak and Snap desktop files sometimes carry odd `Exec=` prefixes. Stripping field codes gets you most of the way; the rest is distro-specific polish I only add when someone sends a failing `.desktop` sample.

I compared Pocket once to `rofi` and `dmenu` on the same machine. They win on fuzzy scoring; Pocket wins on "I wrote the indexing policy and I know when it ran." That trade is personal tooling in a sentence.

Icon theme lookups occasionally block longer than string matching on cold disk cache. If Pocket ever feels laggy on keypress, I will cache pixbufs keyed by icon name before I touch Gtkmm internals.

`pocketrc` font settings taught me that injecting broken CSS is an excellent way to waste an evening. Validating font family strings is still on the list; today stderr plus defaults is the recovery path.
