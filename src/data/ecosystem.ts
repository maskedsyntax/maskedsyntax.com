export type ShippedProduct = {
  name: string;
  websiteUrl: string;
  websiteLabel: string;
  githubUrl: string;
  description: string;
};

/** Shipped Work (order is intentional) */
export const shippedWork: ShippedProduct[] = [
  {
    name: "Trelay",
    websiteUrl: "https://trelay.dev",
    websiteLabel: "trelay.dev",
    githubUrl: "https://github.com/trelay-dev",
    description:
      "A developer-first, privacy-respecting URL manager for self-hosting. Modern web dashboard, powerful CLI, and automation-friendly API.",
  },
  {
    name: "HashPrep",
    websiteUrl: "https://hashprep.com",
    websiteLabel: "hashprep.com",
    githubUrl: "https://github.com/cachevector/hashprep",
    description:
      "Dataset profiler and debugger for machine learning: pre-training quality checks, rich reports, and reproducible fixes.",
  },
  {
    name: "LofiKofi",
    websiteUrl: "https://lofikofi.space",
    websiteLabel: "lofikofi.space",
    githubUrl: "https://github.com/maskedsyntax/lofikofi",
    description:
      "Desktop-first coworking space: layered ambient soundscapes, focus timer, and offline-bundled audio in a Tauri app.",
  },
  {
    name: "RepoGrep",
    websiteUrl: "https://repogrep.maskedsyntax.com",
    websiteLabel: "repogrep.maskedsyntax.com",
    githubUrl: "https://github.com/maskedsyntax/repogrep",
    description:
      "Local-first multi-repo code search: fast parallel scanning, no indexing, three-pane previews.",
  },
  {
    name: "Patterns",
    websiteUrl: "https://patterns.maskedsyntax.com",
    websiteLabel: "patterns.maskedsyntax.com",
    githubUrl: "https://github.com/maskedsyntax/patterns",
    description:
      "Clarity through structured reflection: offline-first journaling and OCD pattern tracking for desktop.",
  },
  {
    name: "Botttle",
    websiteUrl: "https://botttle.dev",
    websiteLabel: "botttle.dev",
    githubUrl: "https://github.com/growvth/botttle",
    description:
      "Self-hosted freelancer client portal: projects, invoicing, time tracking, and a client-facing portal in one stack.",
  },
];
