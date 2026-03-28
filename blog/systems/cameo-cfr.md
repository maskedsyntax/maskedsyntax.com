---
title: "Cameo: OpenCV CFR when the camera lies about timing"
date: "2025-11-08"
tags: ["systems", "cpp", "qt", "opencv", "video"]
summary: "Webcams advertise thirty fps and deliver jitter. Cameo duplicates frames on write so the AVI timeline matches wall clock, not wishful thinking."
reading_time: "5 min"
---

Cameo is a Qt 6 camera app: preview in the window, record to disk with OpenCV `VideoWriter`. The first version felt fine on my machine and wrong for friends: playback sped up or slowed down because **the camera lied about cadence** and I believed the timer. `CAP_PROP_FPS` is a hint, not a promise. The README calls the fix **constant frame rate** enforcement; the code lives in `MainWindow::updateFrame` beside `QElapsedTimer`.

## Preview truth versus recording contract

Preview follows the device: read `CAP_PROP_FPS`, clamp garbage, drive `QTimer`. Recording ignores that fantasy and targets thirty fps with a fixed `MS_PER_FRAME` slice of wall clock.

```cpp
const double TARGET_FPS = 30.0;
const double MS_PER_FRAME = 1000.0 / 30.0;
```

```cpp
double fps = m_cap.get(cv::CAP_PROP_FPS);
if (fps <= 0 || fps > 120) fps = 30;
int interval = static_cast<int>(1000.0 / fps);
m_timer->start(interval);
```

## Duplication is the pragmatic mux

When recording, compare elapsed milliseconds to the last write. If we are late, write the current frame more than once. If we are early, clamp how many duplicates we emit after a stall so we do not blast hundreds of identical frames. A two-hundred-millisecond resync keeps long pauses from drifting forever.

```cpp
if (m_isRecording && m_writer.isOpened()) {
    qint64 currentTimeMs = m_recordingTimer.elapsed();

    if (m_lastRecordingTimeMs == 0) {
        m_writer.write(m_currentFrame);
        m_lastRecordingTimeMs = currentTimeMs;
    } else {
        double delta = currentTimeMs - m_lastRecordingTimeMs;
        int framesToWrite = static_cast<int>(std::round(delta / MS_PER_FRAME));

        if (framesToWrite < 1) framesToWrite = 1;
        if (framesToWrite > 5) framesToWrite = 5;

        for (int i = 0; i < framesToWrite; ++i) {
            m_writer.write(m_currentFrame);
        }

        m_lastRecordingTimeMs += (framesToWrite * MS_PER_FRAME);

        if (std::abs(currentTimeMs - m_lastRecordingTimeMs) > 200) {
            m_lastRecordingTimeMs = currentTimeMs;
        }
    }
}
```

Writer open tries XVID, then MJPEG with the same nominal fps when fourcc support varies by platform build. Still captures go through `cv::imwrite` as PNG with timestamps; no CFR because a single frame has no timeline.

## Everything else is product glue

`discoverCameras` probes indices until `VideoCapture::open` fails; IR and RGB laptops show up as separate entries you can swap without restart. `matToQImage` handles BGR versus grayscale; scaling to the viewfinder label costs CPU but stayed acceptable at 720p, with a source comment about caching on resize later. `style.qss` in Qt resources carries the dark chrome so tweaking hex borders does not mean recompiling C++.

CMake targets Qt6 and OpenCV4. The failure I warn friends about is linking against a different OpenCV than the one your `VideoWriter` expects. Capture and encode run on the UI timer path today; a worker thread would need careful `Mat` sharing if encoding ever becomes the bottleneck.

Friends asked for a visible recording indicator; the status label flips red while `m_isRecording` is true without covering the viewfinder. Hardware encoders would be another project; software fourcc fallbacks kept the scope honest for a weekend app.

Tests stay manual because OpenCV wants hardware and I am not mocking `VideoCapture` for fun. The lesson generalizes: whenever you mux realtime sensors into fixed-fps containers, measure wall clock deltas. Audio has the same class of bug with sample-rate mismatches.

## What CFR does not fix

Players can treat audio separately. Cameo records video; microphone desync is another class of bug. I assumed codecs would interpolate timelines; many do not. Users reported fast-forward motion when hardware delivered fifteen fps while software assumed thirty. Duplication trades file size for a viewer contract you can explain in one sentence.

## After

Cameo reminded me that **time bases disagree by default**. CFR is a promise to whoever presses play. When you cannot trust hardware timestamps, repeating frames is the boring fix that survives contact with real laptops.

`MainWindow.cpp` stays the choke point for capture, record, and scaling; headers document the fps constants so I do not hunt magic numbers during demos. Resources bundle QSS so screenshots in the README match what new contributors build. None of that is clever; it is the kind of scaffolding that keeps a small Qt app legible six months later.

## Epilogue

If you record anything realtime, measure gaps before you argue about codecs. Codecs matter after the timeline makes sense. I learned that from user bug reports that described "fast motion" in plain language while the histogram looked fine to me until I plotted frame deltas.

Dropping frames during recording would shorten the clip; duplicating stretches time so wall clock and player timeline stay cousins instead of strangers.

I keep returning to that distinction when someone asks why the file is larger than "raw" capture: we bought predictable playback with redundant pixels.

