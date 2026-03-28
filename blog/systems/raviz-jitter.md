---
title: "Raviz: audio thread, mutex, OpenGL main"
date: "2026-01-08"
tags: ["systems", "linux", "opengl", "audio", "c"]
summary: "FFT plus OpenGL in one thread looked fine until capture underran. Splitting threads fixed audio; a tiny mutex fixed the sphere."
reading_time: "5 min"
---

Raviz is a toy: a sphere that reacts to whatever is playing through PulseAudio. The fun part is shaders. The part that teaches you about realtime is watching a pretty demo stutter the moment you move the window or resize while audio still flows. The part that ate a weekend was **jitter** when the FFT hop and the display frame stopped being friends. V-sync smooths drawing; it does not give you regular audio blocks if the main thread is busy clearing the screen and polling GLFW.

I tried the lazy version first: read samples and run FFT inline where I already had OpenGL context. Capture underran immediately because `glfwPollEvents` and friends stretched the time between reads. The fix was not "tune buffer sizes until magic happens." It was **admitting two timelines**: realtime audio, interactive render.

## One writer, one reader, memcpy in the middle

The pthread owns Pulse capture and FFT. It allocates scratch buffers once, reads `fft_size` samples, runs `fft_process` into a local float array, then copies into shared memory under a mutex. The main thread never holds the lock across GL calls. It mirrors bins into a stack buffer, unlocks, then displaces vertices or updates uniforms. Audio never waits on the GPU.

```c
void* audio_thread_func(void *arg) {
    AudioThreadState *state = (AudioThreadState*)arg;

    AudioContext *audio = audio_init(&state->config);
    FFTContext *fft = fft_init(&state->config);

    int16_t *audio_buffer = malloc(state->config.fft_size * sizeof(int16_t));
    float *local_fft_output = malloc(state->config.fft_bins * sizeof(float));

    while (state->running) {
        size_t read = audio_read(audio, audio_buffer, state->config.fft_size);
        if (read < state->config.fft_size) {
            struct timespec req = {0, 1000000};
            nanosleep(&req, NULL);
            continue;
        }

        fft_process(fft, audio_buffer, local_fft_output);

        pthread_mutex_lock(&state->mutex);
        memcpy(state->fft_output, local_fft_output, state->config.fft_bins * sizeof(float));
        pthread_mutex_unlock(&state->mutex);
    }
    // cleanup...
    return NULL;
}
```

Short reads sleep a millisecond instead of spinning. Staging into `local_fft_output` keeps lock time down to a memcpy, which is the whole point.

`main.c` loads TOML config, wires SIGINT, allocates the shared spectrum buffer, starts the thread, and loops until shutdown. The first exit bug I hit was skipping `pthread_join`: Pulse complained because the process vanished while the worker still held context. Now shutdown sets `running` false, joins, frees, then tears down GL.

## Pulse discovery and config

`audio.c` runs a Pulse mainloop, asks the server for the default sink, and reads `monitor_source_name`. That feeds `pa_simple` recording so Raviz hears what you hear. Stereo versus mono changes energy in the bins; the shader normalizes so either input is usable without a lecture on PCM layouts.

`RavizConfig` carries FFT size, bin count, decay, gain, transparency. One struct goes to audio init and renderer init so you cannot accidentally size the FFT for sixty-four bins and sample thirty-two in the shader. Hot reload does not exist; restart is cheap for something I run when music is on.

## Platform noise

I develop on X11 first because that is where transparent window flags were tested. Wayland compositors sometimes ignore alpha hints; audio does not care. Future me wants a WAV replay mode so shader tweaks are reproducible without whatever playlist was live that day.

`render.c` keeps geometry uploads off the hot path: buffers allocate once, per-frame work is uniforms and small SSBO tweaks. Profiling showed re-uploading sphere meshes every hop was silly compared to letting the shader chew on the same mesh with new spectral weights. Bass-heavy tracks can swamp the eye without a smoothing curve on bin weights; the curve lives next to the uniforms so tuning is one constant change, not a geometry rebuild.

If display runs near sixty hertz while FFT hops land every ten milliseconds, the sphere can update faster than perception needs. I still copy every GL frame because throttling at render time is simpler than tagging snapshots with sequence numbers in the audio thread. That is laziness I can live with until profiling says otherwise.

`config.toml` in the user config path sets decay, gain, and transparency. I restart when I tweak numbers; hot reload would be nice theater for a toy, not a milestone.

The shared struct at the center is unglamorous: `fft_output`, `fft_bins`, mutex, `running` flag, config snapshot. Boring structs age well when threads are involved.

Pulse monitor capture means Raviz hears system output, not microphone bleed, which matches how I actually listen while coding. If you wanted mic input instead, the threading split would be the same; only `audio_read` would change. The visualization is ambient; the engineering lesson is the mutex.

## After

Raviz is still a toy, but the pattern copies: **capture and transform on a realtime thread, render on another, share a snapshot with a lock you refuse to hold across slow work.** Everything else is window dressing and good music.
