---
title: "ColorSnap: nearest named color in OpenCV"
date: "2025-10-24"
tags: ["experiments", "cpp", "opencv", "color"]
summary: "colorsnap loads a CSV of named RGB values, lets you click a webcam frame, and labels the closest entry using L1 distance in RGB space. Hex formatting is a tiny helper."
reading_time: "5 min"
---

I wanted a desk toy that answers "what is this color called?" without opening a browser. ColorSnap is C++17 with OpenCV for capture and drawing, plus a CSV under `assets/data/colors.csv`. The pipeline is: load table, grab frame, on click sample RGB, find minimum Manhattan distance to a dataset row, draw a label.

## Palette load, hex, and nearest match

`load_colors` reads CSV rows through `read_csv`, skips short rows, and maps columns into integers. Column layout is fixed: identifiers, human name, hex string, then `r g b`. Malformed lines with fewer than six fields are skipped silently so one bad row does not crash the picker. I regenerate `colors.csv` from spreadsheets during palette experiments; keeping hex and RGB in sync prevents mismatches between displayed hash and triplet.

```cpp
std::vector<ColorEntry> load_colors(const std::string filename)
{
    auto raw = read_csv(filename);
    std::vector<ColorEntry> dataset;

    for (const auto &row : raw)
    {
        if (row.size() < 6)
            continue;

        dataset.push_back(
            {row[0], row[1], row[2], std::stoi(row[3]), std::stoi(row[4]), std::stoi(row[5])});
    }

    return dataset;
}
```

`rgb2hex` prints uppercase hex with `snprintf`; an overload for a small `RGB` struct keeps call sites readable.

```cpp
std::string rgb2hex(int r, int g, int b)
{
    char hexcol[8];
    snprintf(hexcol, sizeof(hexcol), "#%02X%02X%02X", r, g, b);
    return std::string(hexcol);
}
```

`getColor` walks the whole table. For a few hundred named colors that is fine. Distance is L1 in RGB. Using `<=` instead of `<` means ties pick the last matching entry in file order; for deterministic ties, sort the dataset or compare names as a secondary key.

```cpp
std::pair<std::string, int> getColor(const RGB &rgb, std::vector<ColorEntry> &dataset)
{
    int minDist = INT_MAX;
    std::string found;
    for (const auto &entry : dataset)
    {
        int distance = abs(rgb.r - entry.r) + abs(rgb.g - entry.g) + abs(rgb.b - entry.b);
        if (distance <= minDist)
        {
            minDist = distance;
            found = entry.color;
        }
    }

    return std::make_pair(found, minDist);
}
```

Perceptual uniformity would need Lab or OKLab and a different metric. This project stayed in RGB because the CSV is RGB and the goal was a quick label, not a thesis on color science. If I extend it, I would convert sample and palette to a linear space before distance, then document the choice in the README.

## UI, webcam quirks, and build

`ClickData` stores whether the user clicked, pixel coordinate, sampled `RGB`, and a pointer to the current frame. Mouse handlers map widget coordinates into image space before reading BGR from `cv::Mat`. Coordinates from `cv::setMouseCallback` are in image pixels before any display scaling.

`drawRoundedRectangle` and `drawLabel` wrap OpenCV primitives so the overlay reads like a sticker; text color follows background luminance so labels stay readable on light and dark regions. White balance and auto exposure skew samples; I mention huge distance in the status line so I do not trust the label blindly. Auto exposure shifts colors between frames; averaging a small neighborhood around the click is an experiment not checked into the minimal reader, which uses a single pixel for simplicity.

`main.cpp` opens the default camera, registers the mouse callback, and spins until quit. Each frame draws the overlay if a color was picked last click. `build.sh` wraps CMake with warnings enabled; OpenCV 4 and fmt are required. Packaging copies `assets/` next to the executable so relative paths keep working. A future `--csv` flag exists in sketches; checked-in `main` defaults to `assets/data/colors.csv`.

## After

ColorSnap is small enough to read in one sitting. The pieces worth copying are the CSV schema, the L1 loop, and the hex helper. Everything else is OpenCV ceremony you will rewrite per project anyway.

I keep a printed color sheet on my desk for sanity checks: if the webcam says "navy" for something I know is teal, the problem is white balance, not the CSV. The toy is useful for naming captures in bug reports where a screenshot alone loses the exact swatch.

`read_csv` returning vector rows is the smallest interface that survived three refactors. Anything fancier pulled in dependencies I did not want for a hundred-line tool.

CMake `find_package(OpenCV)` failures on fresh Linux installs are still the number one support message from friends. Pinning OpenCV 4 in the README is worth more than clever detection code in `CMakeLists.txt`.

If I ever ship a second palette for colorblind-friendly labels, it will be a second CSV and a runtime toggle, not a pile of `#ifdef`s. Data-driven naming scales better than hardcoded enums for this toy.

Quitting with `q` versus clicking the window close button exercised different teardown paths once; both now release the `VideoCapture` so `/dev/video0` is not left busy on Linux after a crash during dev.
