import type { Project } from "../types";

export const projects: Project[] = [
  {
    name: "RepoGrep",
    slug: "repogrep",
    tagline: "Search all your codebases at once.",
    description:
      "A local-first multi-repo code search tool in Rust with fast previews and regex support.",
    problemStatement:
      "Cross-repo search in IDEs is often slow and context switching is expensive.",
    solution:
      "Parallelized scanning with no indexing and a three-pane context UI.",
    keyFeatures: [
      "No-index real-time search",
      "Regex support",
      "Multi-repo scanning",
      "Context preview pane",
    ],
    techStack: ["Rust", "React", "TypeScript"],
    uniquePoints: [
      "Treats OS page cache as the index",
      "Privacy-preserving local architecture",
    ],
    status: "active",
    tags: ["Tooling", "Systems", "Local-first"],
    repoUrl: "https://github.com/maskedsyntax/repogrep",
    score: 26,
  },
  {
    name: "BlockLite",
    slug: "blocklite",
    tagline: "Minimalist decentralized cryptocurrency in Go.",
    description:
      "Educational blockchain implementation of PoW, wallet signing, and consensus.",
    problemStatement:
      "Production blockchain codebases obscure core concepts for learners.",
    solution: "A readable from-scratch Go implementation of a toy cryptocurrency.",
    keyFeatures: [
      "Proof of Work",
      "ECDSA wallets",
      "Longest-chain consensus",
      "Thread-safe mempool",
    ],
    techStack: ["Go", "Gin", "ECDSA", "SHA-256"],
    uniquePoints: ["Built for clarity", "From-scratch networked implementation"],
    status: "active",
    tags: ["Systems", "CLI", "Experimental"],
    repoUrl: "https://github.com/maskedsyntax/blocklite",
    score: 23,
  },
  {
    name: "fengo",
    slug: "fengo",
    tagline: "Lightweight, customizable ASCII art font rendering engine.",
    description:
      "fengo is a lightweight, customizable ASCII art font rendering engine written in Go. It is designed to be simple, secure, and easily extensible with your own JSON-based font formats.",
    problemStatement:
      "ASCII banners and stylized terminal text are often tied to heavy dependencies or opaque font data.",
    solution:
      "A stdlib-first Go engine with JSON font definitions, ANSI colors, and a small CLI for quick rendering.",
    keyFeatures: [
      "Custom JSON fonts",
      "ANSI color presets",
      "Multi-line rendering",
      "Zero non-stdlib dependencies for core logic",
    ],
    techStack: ["Go"],
    uniquePoints: ["Portable font format", "CLI and library use"],
    status: "active",
    tags: ["CLI", "Tooling"],
    repoUrl: "https://github.com/bliplang/fengo",
    score: 22,
  },
  {
    name: "image-diff",
    slug: "image-diff",
    tagline: "Visual regression and dataset image comparison in the terminal.",
    description:
      "image-diff is a high-performance CLI tool designed for visual regression testing and dataset validation. It provides structural and pixel-level comparison of images with instant terminal-native previews.",
    problemStatement:
      "Image diffs for tests and datasets need speed, perceptual accuracy, and CI-friendly output.",
    solution:
      "A Rust CLI with parallel scans, CIEDE2000-aware comparison, Sixel/Kitty previews, and JSON exit codes.",
    keyFeatures: [
      "Directory and file diffs",
      "Terminal graphics previews with ANSI fallback",
      "Mask and ignore regions",
      "JSON output and semantic exit codes",
    ],
    techStack: ["Rust", "Rayon"],
    uniquePoints: ["CI-ready reporting", "Perceptual color distance"],
    status: "active",
    tags: ["CLI", "Tooling", "ML"],
    repoUrl: "https://github.com/cachevector/image-diff",
    score: 22,
  },
  {
    name: "raviz",
    slug: "raviz",
    tagline: "High-performance audio-reactive 3D visualizer for Linux.",
    description:
      "Renders a glowing, deformable 3D sphere that reacts to system audio in real time. Runs in a transparent, borderless window using OpenGL 3.3+.",
    problemStatement:
      "Desktop audio visualization often ships as heavy stacks or closed plugins.",
    solution:
      "A native C + OpenGL app with PulseAudio capture, FFT analysis, and a low-latency render loop.",
    keyFeatures: [
      "Transparent X11 and Wayland window",
      "Real-time FFT from system audio",
      "Configurable TOML and CLI",
      "Fresnel-lit deformable sphere",
    ],
    techStack: ["C", "OpenGL", "PulseAudio", "FFTW"],
    uniquePoints: ["Floating always-on-top visual", "Bass and mid frequency response"],
    status: "active",
    tags: ["Systems", "Linux", "Experiments"],
    repoUrl: "https://github.com/maskedsyntax/raviz",
    score: 22,
  },
  {
    name: "Javalution",
    slug: "javalution",
    tagline: "High-performance Conway’s Game of Life simulator.",
    description:
      "Javalution is a high-performance Conway’s Game of Life simulator featuring a chunk-based grid for virtually infinite worlds, smooth zoom/pan rendering, and RLE pattern support.",
    problemStatement:
      "Large Game of Life simulations need scalable storage and fluid interaction without stutter.",
    solution:
      "A JavaFX app with chunked infinite grids, multithreaded updates, and standard RLE pattern import.",
    keyFeatures: [
      "Chunk-based infinite world",
      "Zoom, pan, and grid overlay",
      "Multithreaded generations",
      "RLE pattern library",
    ],
    techStack: ["Java", "JavaFX", "Gradle"],
    uniquePoints: ["Infinite playfield model", "Desktop packages for Linux"],
    status: "active",
    tags: ["Systems", "Experiments", "JVM"],
    repoUrl: "https://github.com/maskedsyntax/javalution",
    score: 22,
  },
  {
    name: "Celestia",
    slug: "celestia",
    tagline: "N-body gravitational simulation in Fortran.",
    description:
      "Barnes-Hut optimized simulation with Velocity Verlet integration and web visualization.",
    problemStatement:
      "Naive n-body simulation has quadratic cost and unstable long-run dynamics.",
    solution:
      "O(N log N) octree approximation, OpenMP parallelism, and symplectic integration.",
    keyFeatures: [
      "Barnes-Hut octree",
      "OpenMP parallel force calculation",
      "Collision merging",
      "Web visualization pipeline",
    ],
    techStack: ["Fortran", "OpenMP", "Python", "JavaScript"],
    uniquePoints: ["Scientific-computing performance", "Stable orbital mechanics"],
    status: "active",
    tags: ["ML", "Systems", "Research"],
    repoUrl: "https://github.com/maskedsyntax/celestia",
    score: 24,
  },
  {
    name: "Dopamine",
    slug: "dopamine",
    tagline: "Offline terminal music player in Rust.",
    description:
      "Keyboard-first TUI player with low CPU usage, local lyrics sync, and MPRIS integration.",
    problemStatement:
      "GUI players are often heavy and less efficient for keyboard-driven workflows.",
    solution:
      "A Ratatui + Rodio app with a fast indexer and smart focus navigation.",
    keyFeatures: [
      "Multi-threaded library indexing",
      "MPRIS media key controls",
      "Lyrics lookup and offset",
      "Theme presets",
    ],
    techStack: ["Rust", "Ratatui", "Rodio", "SQLite"],
    uniquePoints: ["Low-jitter playback", "Powerful TUI state machine"],
    status: "active",
    tags: ["CLI", "Tooling", "Local-first"],
    repoUrl: "https://github.com/maskedsyntax/dopamine",
    score: 22,
  },
  {
    name: "jvman",
    slug: "jvman",
    tagline: "Cross-platform Java version manager.",
    description:
      "Go-based JDK manager with shim-based version resolution and project-local config support.",
    problemStatement:
      "Java version management across OSes is fragmented and inconsistent.",
    solution:
      "Single binary with vendor support and per-project Java version resolution.",
    keyFeatures: [
      "Shim architecture",
      "Project-local .jvman files",
      "Multi-vendor downloads",
      "Interactive TUI",
    ],
    techStack: ["Go", "TUI", "Shims"],
    uniquePoints: ["Fast shell invocation overhead", "Cross-platform parity"],
    status: "active",
    tags: ["CLI", "Tooling", "Systems"],
    repoUrl: "https://github.com/maskedsyntax/jvman",
    featured: true,
    score: 21,
  },
  {
    name: "FractalDive",
    slug: "fractaldive",
    tagline: "High-precision interactive fractal explorer.",
    description:
      "Julia + CUDA fractal explorer with dynamic precision switching for deep zoom exploration.",
    problemStatement:
      "Float64 precision breaks at deep Mandelbrot zoom levels.",
    solution:
      "GPU rendering at normal zoom and BigFloat CPU fallback beyond precision thresholds.",
    keyFeatures: [
      "Dynamic precision engine",
      "CUDA acceleration",
      "Interruptible rendering",
      "Live parameter tuning",
    ],
    techStack: ["Julia", "CUDA", "BigFloat"],
    uniquePoints: ["Hybrid precision pipeline", "Interactive deep zoom"],
    status: "active",
    tags: ["ML", "Experiments", "Research"],
    repoUrl: "https://github.com/maskedsyntax/fractaldive",
    score: 22,
  },
  {
    name: "HARM",
    slug: "harm",
    tagline: "CLI-first ARM7 emulator in Haskell.",
    description:
      "Instruction-level emulator with REPL stepping, CPSR flags, and virtual I/O.",
    problemStatement:
      "Low-level CPU architecture learning needs a transparent execution model.",
    solution: "A functional state-transform architecture with explicit instruction decoding.",
    keyFeatures: [
      "ARM data-processing instructions",
      "Condition code support",
      "Breakpoints and stepping",
      "Virtual UART",
    ],
    techStack: ["Haskell", "GHC", "Cabal"],
    uniquePoints: ["State monad model", "Functional emulator architecture"],
    status: "active",
    tags: ["Systems", "Compiler", "Experimental"],
    repoUrl: "https://github.com/maskedsyntax/harm",
    featured: true,
    score: 21,
  },
  {
    name: "SoundSnatch",
    slug: "soundsnatch",
    tagline: "Download audio from YouTube with a polished TUI.",
    description:
      "A Bubble Tea-powered interface for downloading tracks and playlists with local-first control.",
    problemStatement:
      "Command-heavy media download tools are powerful but hard to use repeatedly.",
    solution:
      "An interactive TUI wrapper around yt-dlp with guided flow, directory picking, and naming controls.",
    keyFeatures: [
      "Playlist and single-track support",
      "Interactive directory picker",
      "Filename customization",
      "Progress feedback",
    ],
    techStack: ["Go", "Bubble Tea", "yt-dlp", "Lip Gloss"],
    uniquePoints: ["TUI-first media workflow", "Great UX over raw command complexity"],
    status: "active",
    tags: ["CLI", "Tooling", "Local-first"],
    repoUrl: "https://github.com/maskedsyntax/soundsnatch",
    score: 21,
  },
  {
    name: "Markd",
    slug: "markd",
    tagline: "Offline markdown note compiler and publisher.",
    description:
      "A Rust tool that watches notes folders and compiles them into searchable static sites.",
    problemStatement:
      "Most markdown knowledge tools are heavy, cloud-bound, or over-configured.",
    solution:
      "Single-binary build/watch flow with integrated indexing and static output.",
    keyFeatures: [
      "Folder watch mode",
      "Search indexing",
      "Table of contents generation",
      "Themeable output templates",
    ],
    techStack: ["Rust", "Tantivy", "Tera"],
    uniquePoints: ["Fast local-first pipeline", "Search-first static publishing"],
    status: "active",
    tags: ["Tooling", "Systems", "Local-first"],
    repoUrl: "https://github.com/maskedsyntax/markd",
    featured: true,
    score: 22,
  },
  {
    name: "HashPrep",
    slug: "hashprep",
    tagline: "Dataset profiler and debugger for machine learning.",
    description:
      "A tooling-focused workflow for inspecting dataset quality and debugging feature/data issues before training.",
    problemStatement:
      "ML teams often discover data quality issues too late in the pipeline.",
    solution:
      "A diagnostics-first toolkit that surfaces data issues early and makes dataset inspection repeatable.",
    keyFeatures: [
      "Dataset profiling",
      "Schema and quality checks",
      "Debug views for ML features",
      "Fast feedback loops",
    ],
    techStack: ["Python"],
    uniquePoints: ["Data-first debugging workflow", "Built for practical ML iteration"],
    status: "active",
    tags: ["ML", "Tooling", "Data"],
    repoUrl: "https://github.com/cachevector/hashprep",
    featured: true,
    score: 21,
  },
  {
    name: "Trelay",
    slug: "trelay",
    tagline: "A developer-first, privacy-respecting URL manager for self-hosting.",
    description:
      "A developer-first, privacy-respecting URL manager for self-hosting. Modern web dashboard, powerful CLI, and automation-friendly API.",
    problemStatement:
      "Teams lose time on fragmented workflow handoffs and ad-hoc automation scripts.",
    solution:
      "A centralized relay model that standardizes workflow transitions and automation triggers.",
    keyFeatures: [
      "Workflow relays",
      "Automation hooks",
      "Developer-friendly setup",
      "Lean operational model",
    ],
    techStack: ["Go"],
    uniquePoints: ["Workflow-first architecture", "Built around day-to-day team operations"],
    status: "active",
    tags: ["Tooling", "Automation", "Systems"],
    repoUrl: "https://github.com/trelay-dev/trelay",
    score: 21,
  },
  {
    name: "Pocket",
    slug: "pocket",
    tagline: "Lightweight application launcher for Linux.",
    description:
      "A native C++/GTK launcher optimized for fast startup and keyboard-driven desktop workflows.",
    problemStatement:
      "Existing launchers can feel heavy or slow on minimalist Linux setups.",
    solution:
      "A minimal and responsive launcher with simple configuration and native integration.",
    keyFeatures: [
      "Fast startup",
      "Keyboard-centric UX",
      "Native GTK integration",
      "Simple customization",
    ],
    techStack: ["C++", "GTK"],
    uniquePoints: ["Minimal footprint", "Built for tiling window manager workflows"],
    status: "active",
    tags: ["Systems", "Linux", "Tooling"],
    repoUrl: "https://github.com/maskedsyntax/pocket",
    score: 20,
  },
  {
    name: "doqtor",
    slug: "doqtor",
    tagline: "Your docs are lying. Doqtor keeps them in sync with your code, automatically.",
    description:
      "Doqtor detects documentation drift after code changes and opens pull requests with fixes. It doesn't generate docs from scratch. It makes sure your existing docs stay correct.",
    problemStatement:
      "Documentation drifts as soon as code changes, causing stale examples and broken API references.",
    solution:
      "Diff-aware documentation drift detection with automated fix PRs triggered from repository change flow.",
    keyFeatures: [
      "Diff analysis on merged changes",
      "Doc symbol matching and drift detection",
      "Confidence-scored detections",
      "Automatic fix PR generation",
    ],
    techStack: ["TypeScript", "Bun", "GitHub App"],
    uniquePoints: ["Fixes existing docs instead of regenerating", "Only processes changed surfaces"],
    status: "active",
    tags: ["Tooling", "Docs", "Automation"],
    repoUrl: "https://github.com/cachevector/doqtor",
    current: true,
    score: 22,
  },
  {
    name: "MiniForth",
    slug: "miniforth",
    tagline: "High-performance Forth interpreter on the JVM.",
    description:
      "A stack-based Forth variant interpreter on the JVM with control structures, debugger support, optimization passes, and bytecode compilation.",
    problemStatement:
      "Building custom language runtimes on the JVM usually sacrifices low-level control or performance.",
    solution:
      "A Forth-inspired interpreter and compiler pipeline using Java and ASM for fast execution while keeping language flexibility.",
    keyFeatures: [
      "JVM bytecode compiler via ASM",
      "Interactive REPL and debugger",
      "Control structures and word definitions",
      "Optimization passes and benchmark tooling",
    ],
    techStack: ["Java", "JVM", "ASM", "Maven"],
    uniquePoints: ["Forth-on-JVM architecture", "Compiler + interpreter in one runtime"],
    status: "active",
    tags: ["Compiler", "Systems", "JVM"],
    repoUrl: "https://github.com/maskedsyntax/miniforth",
    featured: true,
    score: 22,
  },
  {
    name: "FuzzyBunny",
    slug: "fuzzybunny",
    tagline: "High-performance fuzzy string matching for Python.",
    description:
      "A lightweight fuzzy matching library with a C++ core and Pybind11 bindings, built for fast ranking and batch matching.",
    problemStatement:
      "Pure-Python fuzzy matching libraries can become bottlenecks on larger datasets and ranking workloads.",
    solution:
      "A C++ implementation with Python ergonomics, multiple scorers, and parallel processing support.",
    keyFeatures: [
      "C++ core with Pybind11",
      "Multiple scoring algorithms",
      "Batch and parallel matching",
      "Pandas and NumPy integration",
    ],
    techStack: ["C++", "Python", "Pybind11", "OpenMP"],
    uniquePoints: ["Performance-first Python API", "Thread-safe fuzzy ranking"],
    status: "active",
    tags: ["ML", "Tooling", "Library"],
    repoUrl: "https://github.com/cachevector/fuzzybunny",
    featured: true,
    score: 22,
  },
];

export const featuredProjects = projects.filter((project) => project.featured).slice(0, 6);
export const currentlyBuilding = projects.find((project) => project.current);

/** Projects page: up to 10 items; excludes homepage highlights (featured, in progress, Shipped Work duplicates). */
export const projectsForProjectsPage = projects
  .filter(
    (p) =>
      !p.featured &&
      !p.current &&
      p.slug !== "trelay" &&
      p.slug !== "repogrep"
  )
  .sort((a, b) => b.score - a.score)
  .slice(0, 10);
