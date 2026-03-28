---
title: "Pod: a small Qt power bar that behaves on every install"
date: "2025-10-04"
tags: ["systems", "linux", "qt", "cpp"]
summary: "I wanted shutdown, reboot, lock, suspend, and logout in one frameless strip. The interesting part was making icons and QSS resolve the same way from build trees, user config, and /usr/share."
reading_time: "5 min"
---

Before I wired this, I was juggling different keybindings per window manager and half-broken menu entries after upgrades. Pod is a tiny Qt widget: five big buttons in a row, default focus on lock so a stray Enter does not power the machine off. After shipping, the lesson that stuck was not the UI. It was **search paths** for assets and styles so the same binary looks right from a build folder, from `$HOME/.config`, or from a system package.

## What the window does

The window is frameless, stays on top, and closes on Escape. Each action runs through bash so I keep using commands I already trust (`systemctl`, `loginctl`, `i3lock`, `i3-msg`):

```cpp
addButton(layout, "poweroff", "Shutdown", "system-shutdown", "systemctl poweroff");
addButton(layout, "reboot",   "Reboot",   "system-reboot",   "systemctl reboot");
HoverButton* lockBtn = addButton(layout, "lock",     "Lock",     "system-lock-screen", "i3lock -c 000000");
addButton(layout, "sleep",    "Suspend",  "system-suspend",  "loginctl suspend");
addButton(layout, "logout",   "Logout",   "system-log-out",  "i3-msg exit");
```

The click handler detaches a process and quits so the little window does not hang around:

```cpp
connect(btn, &QPushButton::clicked, [cmd]() {
    QProcess::startDetached("/bin/bash", QStringList() << "-c" << cmd);
    QApplication::quit();
});
```

If a distro names a unit differently, I change one string, not a pile of C API calls. On Wayland-heavy setups, `i3-msg` logout will not apply. I document that in the README and swap the command locally. The app does not try to detect session type; autodetection that fails silently breaks niche compositors. A string you can edit wins.

`resources.qrc` bundles SVG icons and `style.qss` so installed binaries still find assets. A GitHub Actions workflow builds release artifacts for tagged versions with a small Linux-first matrix. Arch PKGBUILDs or `cmake --install` drop binaries under `/usr`; the search path list includes that prefix. Buttons expose tooltips where Qt forwards them; focus order follows layout left-to-right with lock default for safety.

## Icons and stylesheets: the same question everywhere

`HoverButton` tries paths in order: cwd assets, paths next to the binary, `~/.config/pod`, Qt resources, then `/usr/share/pod`. If nothing loads, it falls back to freedesktop icon names. I draw a second pixmap for hover (black silhouette via composition mode) so I do not depend on SVG states inside files.

```cpp
QStringList searchPaths;
searchPaths << QDir::currentPath() + "/assets/" + iconName + ".svg";
searchPaths << QCoreApplication::applicationDirPath() + "/../assets/" + iconName + ".svg";
searchPaths << QCoreApplication::applicationDirPath() + "/assets/" + iconName + ".svg";
searchPaths << QDir::homePath() + "/.config/pod/assets/" + iconName + ".svg";
searchPaths << ":/assets/" + iconName + ".svg";
searchPaths << "/usr/share/pod/assets/" + iconName + ".svg";
```

`loadStyle` walks a similar list: user `style.qss` wins over embedded QSS, and system-wide still works for packaged installs.

```cpp
QStringList searchPaths;
searchPaths << QDir::homePath() + "/.config/pod/style.qss";
searchPaths << ":/style.qss";
searchPaths << "style.qss";
searchPaths << "../style.qss";
searchPaths << "/usr/share/pod/style.qss";
```

During the project I kept asking: **where will this binary think it lives?** Developers run from `build/`, packagers install to `/usr/bin`, I sometimes symlink a local build into `~/bin`. Wrong order means empty buttons or wrong QSS; it looks like the app is broken when it is path resolution.

## Focus and footguns

Default focus lands on the lock button after show so muscle memory from other dialogs does not send you into `poweroff`:

```cpp
if (lockBtn) {
    QTimer::singleShot(0, lockBtn, [lockBtn](){
        lockBtn->setFocus();
        lockBtn->updateVisuals();
    });
}
```

Enter on a focused `HoverButton` triggers `animateClick`, same path as mouse.

## After

I still treat Pod as a personal utility, not a framework. The payoff is one place to adjust power actions when I change WMs, plus a codebase small enough to reread `main.cpp` in one sitting. Most bugs I hit were "file not found," not Qt logic. Shell scripts cannot draw hover states consistently across WMs; Qt gives one path for pixmaps and keyboard focus. If you borrow the idea, keep path lists explicit and test from at least two install layouts.

Friends who tried Pod on systemd-free setups swapped `systemctl` lines for their init without touching C++. That was the design goal: boring glue, obvious edit points, no policy engine pretending to be smarter than the user.

CMake install rules that copy `assets/` next to the binary are worth the ten lines of script. Without them, packagers file bugs about blank icons that are really search path bugs.

Hover composition mode code is easy to get subtly wrong on HiDPI displays. Testing on one 1x monitor and one 2x laptop caught scaling bugs that looked fine in screenshots on either alone.

I resisted adding a sixth button for "hibernate" because resume reliability varies more than suspend. Power UX is political on shared machines; fewer choices means fewer accidental data loss stories.
