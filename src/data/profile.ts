export type SocialLink = {
  href: string;
  label: string;
  icon: "x" | "threads" | "linkedin" | "peerlist" | "github";
};

export const profile = {
  name: "Aftaab Siddiqui",
  handle: "MaskedSyntax",
  bio: "Making tools. Building at the edge of ML and systems.",
  role: "Systems + ML, one head. I’d rather ship a scrappy tool than finish a tutorial playlist.",
  homeIntro:
    "Most of what I build lives on disk next to you: CLIs, chunky desktop apps, stuff that doesn’t need a login wall. I like code I can grep six months later without cringing.",
  homeFocus:
    "Lately most of my ML work is data-first: pre-training checks, wide messy tables, and turning notebook experiments into pipelines that survive bad exports. That is the lane I am in at Cachevector, including HashPrep. On the systems side I ship local-first Rust and Go tools: terminal UIs, small native GUIs when it fits, parallel scan and search without a background indexer, and startup and disk IO that stay fast for daily use.",
  /** Shown on home: this site vs hire-oriented web/mobile profile */
  homeTwoSitesNote:
    "I still take web + mobile client work, I just don’t advertise it here because it’d feel weird next to a pile of Rust screenshots. That stuff’s on",
  company: "cachevector",
  stats: {
    publicRepos: 87,
    followers: 54,
    following: 28,
    joined: "2020-09-07",
  },
  links: {
    github: "https://github.com/maskedsyntax",
    twitter: "https://x.com/aftaab___",
    website: "https://aftaab.xyz",
    cachevector: "https://cachevector.com",
  },
  socialLinks: [
    { href: "https://x.com/aftaab___", label: "X", icon: "x" },
    { href: "https://www.threads.com/@aftaab___", label: "Threads", icon: "threads" },
    { href: "https://www.linkedin.com/in/aftaabsiddiqui/", label: "LinkedIn", icon: "linkedin" },
    { href: "https://peerlist.io/aftaabsiddiqui", label: "Peerlist", icon: "peerlist" },
    { href: "https://github.com/maskedsyntax", label: "GitHub", icon: "github" },
  ] satisfies SocialLink[],
  pinnedRepos: [
    "soundsnatch",
    "2-stage-opamp-analysis",
    "blocklite",
    "focusbrew",
    "generx-mapper",
    "intellipath",
  ],
};
