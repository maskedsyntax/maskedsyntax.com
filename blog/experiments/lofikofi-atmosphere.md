---
title: "LofiKofi: ambient layers in Flutter"
date: "2025-11-22"
tags: ["experiments", "dart", "flutter", "audio"]
summary: "The desktop app wraps focus panels and a mixer. Ambient sounds are AssetSource loops with per-layer volume and explicit dispose."
reading_time: "5 min"
---

LofiKofi is a Flutter desktop experiment: a board, todos, focus timer, and an ambient mixer so I can run rain or cafe noise under real work. Hot reload for UI plus native audio through `audioplayers` beat wiring Electron for a weekend prototype. The audio code is deliberately small. Each layer owns an `AudioPlayer`, loops with `ReleaseMode.loop`, and exposes `play`, `stop`, `setVol`, and `toggle`.

## AmbientLayer and the mixer catalog

```dart
class AmbientLayer {
  final String id;
  final String label;
  final String hint;
  final String file;
  final AudioPlayer _player = AudioPlayer();
  bool active = false;
  double volume = 0.55;

  Future<void> play() async {
    await _player.setReleaseMode(ReleaseMode.loop);
    await _player.setVolume(volume);
    await _player.play(AssetSource('sounds/$file'));
    active = true;
  }

  Future<void> stop() async {
    await _player.stop();
    active = false;
  }

  Future<void> setVol(double v) async {
    volume = v;
    await _player.setVolume(v);
  }

  Future<void> toggle() async {
    if (active) {
      await stop();
    } else {
      await play();
    }
  }

  void dispose() {
    _player.dispose();
  }
}
```

`AssetSource` keeps paths relative to `assets/sounds` in `pubspec.yaml`. Forgetting to list a file there fails at runtime with a clear missing asset error. Every `rain_loop.mp3` entry must appear under `flutter.assets`; I group sounds under `assets/sounds/` and keep filenames aligned with the layer table so a typo fails fast.

`AmbientMixer` holds a fixed list of layers (rain, forest, and so on) so the UI maps buttons without dynamic discovery. `activeCount` drives a badge so I know how many loops stack. Stacking three loud layers still clips on cheap hardware, so the panel exposes volume per layer instead of only a master gain. Fourteen simultaneous `AudioPlayer` instances work on my laptop but not on every integrated GPU machine; `activeCount` is the canary if I need a global limiter later. Running many loops spins fans; I default users to one or two layers and use sliders to avoid clipping when waves sum.

## Panels, theme, lifecycle, and desktop audio

`focus_panel.dart` pairs Pomodoro-style timers with the mixer so deep work is one surface; state resets when the window closes unless I add persistence later. `board_panel.dart` holds kanban-style columns; drag-and-drop would need `ReorderableListView` or custom gestures. Shared `theme.dart` defines spacing and accent colors so panels feel like one app. I avoid `Provider` overkill for now; `StatefulWidget` suffices at this scale. State lives above the audio objects so toggling sound does not rebuild the entire tree every frame.

Flutter desktop can leave players around after route changes. Calling `dispose` on the mixer from root state when the window closes avoids zombie audio threads; I hit that once when hot restarting during development. Flutter desktop on Linux needs ALSA or Pulse for `audioplayers`; I test headphones and HDMI separately because default sinks differ.

## Marketing site, assets, tests

The `apps/marketing` Vite app is separate so screenshots and copy do not ship inside the desktop binary. It builds independently in CI so broken Dart does not block publishing screenshots. More moving parts, tolerable build times.

Loops are recorded or sourced from royalty-free packs with licenses in `NOTICE` when required. `widget_test.dart` only smoke-mounts the app; audio paths are not exercised in CI.

## After

LofiKofi is a comfort project. The technical note I care about is the `AmbientLayer` API: loop mode, volume, toggle, dispose. Everything else is UI glue. If you fork it, add crossfade before you add more than five simultaneous loops.

The board and todo panels are intentionally plain. I did not want another productivity app that ships twenty features and three accounts. The mixer is the only part that feels magical in daily use; everything else is scaffolding so I have one window instead of three browser tabs playing YouTube rain videos.

When desktop audio glitches, I blame Bluetooth first, Flutter second, and only then the asset encoding. MP3 loops with clean zero crossings at the seam matter more than any Dart trick for avoiding speaker pops between iterations.

`StatefulWidget` at the root means I can lift timer state without reaching for Riverpod. If the app grows a sync backend, that choice will age poorly; for a weekend shell it keeps `flutter analyze` quiet and the widget tree shallow enough to screenshot for friends.

Marketing copy lives in the Vite app because I did not want release notes inside `pubspec.yaml` comments. Separation of concerns sounds enterprise; here it just means I can fix a typo on the website without shipping a new desktop build.

Window size defaults target laptops first; ultrawide layouts get whitespace I have not tuned. Desktop Flutter still feels young enough that chasing perfect resize on every platform is a trap for a side project. I would rather ship rough edges than stall on pixel-perfect gutters.
