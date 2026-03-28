---
title: "Canvaz: Qt UI plus raw X11 for wallpapers"
date: "2025-12-04"
tags: ["systems", "cpp", "x11", "qt", "linux"]
summary: "I wanted a gallery, scaling modes, and a straight path to the root window pixmap. Canvaz keeps most of the app in Qt, then drops into Xlib for the part shell tools usually wrap."
reading_time: "5 min"
---

I used to lean on `feh` one-liners until flag churn and multi-monitor quirks made my scripts feel brittle. Canvaz is a Qt desktop app: it scans folders for images, shows thumbnails, and applies a wallpaper with scaling modes. The part I wanted to own was the **last mile** to X11: pixmap creation, root window background, and the atoms some compositors expect. Everything before that is normal GUI work. I still treat Wayland as a separate project; this path is intentionally X11-shaped.

## Scanner thread and thumbnail IO

Wallpaper scanning runs off the UI thread. The main window moves a `WallpaperScanner` onto a `QThread`, connects `startScan` to `scan`, and listens for `imageLoaded` to populate the list. On shutdown the destructor asks the scanner to stop, quits the thread, and waits so callbacks do not land after widgets disappear.

`WallpaperScanner` walks each configured root with `QDirIterator`, filters common extensions, and reads thumbnails through `QImageReader` with `setAllocationLimit(0)` so Qt does not refuse large decodes during development. It scales to thumb size before `read()` so the grid never holds full-resolution images.

```cpp
QDirIterator it(path, nameFilters, QDir::Files | QDir::NoSymLinks, QDirIterator::Subdirectories);
while (it.hasNext()) {
    QString filePath = it.next();
    QImageReader reader(filePath);
    reader.setAllocationLimit(0);
    QSize scaledSize = originalSize.scaled(thumbSize, Qt::KeepAspectRatio);
    reader.setScaledSize(scaledSize);
    QImage img = reader.read();
    if (!img.isNull()) {
        emit imageLoaded(filePath, img, it.fileName());
    }
}
```

`m_stop` aborts long scans when the window closes. Large wallpaper decodes can spike RAM; reader limits help.

## X11 pixmap, root background, atoms, and the double-free footgun

`setX11Wallpaper` opens the display, grabs the root window, allocates a pixmap the size of the default screen, fills background color, paints the image with `QPainter` into `QImage`, converts to `Format_RGB32`, then `XCreateImage` and `XPutImage` copy pixels. Scaling branches are repetitive on purpose: each mode (`Zoomed`, `Scaled`, `Centered`, and keep-aspect variants) maps to a small matrix of `drawImage` calls. Dual monitor mode walks `QGuiApplication::screens()` and picks `path1` or `path2` per index. `screens()` ordering does not always match mental model of "left monitor"; combo labels are simplified; advanced EDID mapping is future work.

```cpp
Display *display = XOpenDisplay(NULL);
int screen_num = DefaultScreen(display);
Window root = RootWindow(display, screen_num);
int width = DisplayWidth(display, screen_num);
int height = DisplayHeight(display, screen_num);
int depth = DefaultDepth(display, screen_num);

Pixmap pixmap = XCreatePixmap(display, root, width, height, depth);
GC gc = XCreateGC(display, pixmap, 0, NULL);
```

After the pixmap holds final bits, assign root background and publish `_XROOTPMAP_ID` and `ESETROOT_PMAP_ID` for clients that watch those atoms. `XSetCloseDownMode(display, RetainPermanent)` tries to keep the pixmap after the connection closes so the wallpaper does not vanish on exit. The tricky bit is `XImage` buffer lifetime: null `ximage->data` before `XDestroyImage` because Qt owns the backing bits from `QImage`. Let libX11 free that buffer and you double-free under valgrind.

Before Canvaz I had three half-working scripts per machine. During development the bugs were almost never decoding; they were geometry (virtual versus physical monitors), depth mismatches, and forgetting to clear the root after setting the pixmap.

## Preferences, downloads, color mode, CMake

`PreferencesDialog` persists roots and scaling defaults via `QStandardPaths`. `onDownload` fetches remote images into the scan pipeline; timeouts and SSL errors surface via `QMessageBox`. The color picker path clears the list selection so UI state matches "solid color background" instead of a stale highlighted file. That sounds minor until `onApply` sees both an image path and `currentColor` set; explicit state beats implicit precedence in the handler.

The project targets Qt6 widgets. Missing X11 dev packages fail link with clear errors on headless CI unless you skip GUI tests. If you read the repo, start at `MainWindow::onApply` for how UI state picks paths and modes, then `setX11Wallpaper` for the protocol edge.

## After

The split keeps Qt idioms in Qt land and keeps the X11 surface small enough to audit. Shell tools wrap some of this; owning the last mile meant I could stop fighting flag churn per machine.

Compositors that repaint the root pixmap differently after suspend/resume are why I still keep one `feh` fallback script in my notes. Canvaz covers the happy X11 path; reality sometimes needs the blunt tool after a graphics driver update.

Downloading wallpapers in-app was a late addition. It shares the same scanner pipeline as local folders so I do not maintain two thumbnail code paths. That decision cost a little coupling and saved a lot of duplicated Qt image code.

`QNetworkAccessManager` timeouts saved me from hung UI threads when hotel Wi-Fi dropped mid-download. Network code in wallpaper apps sounds silly until you watch a user stare at a frozen progress bar.

I still test `onApply` with only a solid color selected after browsing images. That sequence caught a stale path bug once where the handler preferred the last image over the explicit color choice.
