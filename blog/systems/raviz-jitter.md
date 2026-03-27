---
title: "Raviz: Fighting Jitter in Real-Time Visualization"
date: "2026-01-08"
tags: ["systems", "linux", "opengl", "audio", "c"]
summary: "A wobbly sphere reacting to music sounds cool until the frame graph stutters. Here's how I separated audio work from draw work on Linux."
reading_time: "15 min"
---

Raviz is a tiny transparent window: **OpenGL** sphere, **PulseAudio** tap, FFT → deformation. The fun part isn’t the shader — it’s **jitter**. Humans notice frame pacing before they notice average FPS.

Early versions looked fine in `nvidia-settings` and still **felt wrong** because audio callbacks and the render loop shared assumptions they shouldn’t.

## The rough architecture

```text
 ┌──────────────┐       mutex / lock       ┌──────────────┐
 │ audio thread│ ─── FFT ring buffer ───►│ render thread │
 │ (capture)   │                         │ (OpenGL)      │
 └──────────────┘                         └──────────────┘
```

Capture runs as fast as it needs; rendering **samples** the latest stable snapshot.

## Double buffering FFT data

You don’t want the GL thread reading the FFT array while the audio thread writes the next block.

```text
  write index ──┐
                ▼
         [ buffer A | buffer B ]
                ▼
  read index ───┘  (render uses last complete frame)
```

Classic producer/consumer. Boring **works**.

## Why not “just v-sync harder”?

V-sync hides some issues but not **audio→visual** latency spikes. If your FFT hop is irregular, the sphere **shivers** even at 60 Hz.

## OpenGL notes

- Keep uploads small — update uniforms or SSBOs, don’t rebuild geometry every frame unless needed.
- `glfwPollEvents` timing matters; blocking in the wrong place stalls everything.

## pthread-flavored sketch (C)

```c
typedef struct {
    float fft_bins[64];
    pthread_mutex_t lock;
} AudioState;

void *audio_main(void *arg) {
    AudioState *audio = arg;
    float latest[64];
    for (;;) {
        capture_and_fft(latest);
        pthread_mutex_lock(&audio->lock);
        memcpy(audio->fft_bins, latest, sizeof latest);
        pthread_mutex_unlock(&audio->lock);
    }
    return NULL;
}

void render_frame(AudioState *audio) {
    float local[64];
    pthread_mutex_lock(&audio->lock);
    memcpy(local, audio->fft_bins, sizeof local);
    pthread_mutex_unlock(&audio->lock);
    draw_sphere(local);
}
```

Copy **out** under lock, then draw with no lock — fewer chances to deadlock GL.

## Learnings

- Separate **real-time constraints** (audio) from **presentation** (video).
- Profiling: graph frame times; don’t trust averages alone — **percentiles** tell the jitter story.
- A toy visualizer still deserves the same pipeline hygiene as a game loop.

Still tweaking defaults on Wayland vs X11 — but the threading split was the unlock.
