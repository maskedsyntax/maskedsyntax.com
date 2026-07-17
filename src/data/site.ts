/**
 * Brand copy for maskedsyntax.com.
 *
 * Subdomain apps can mirror these strings and CSS variables for cohesion:
 *   --bg, --card, --text, --muted, --border, --accent (see styles.css)
 *   wordmark: "MaskedSyntax"
 *   footerLine: site.brand.footerLine
 */

export const site = {
  brand: {
    wordmark: "MaskedSyntax",
    domain: "maskedsyntax.com",
    tagline: "Small tools built for everyday use.",
    footerLine: "Masked Syntax · maskedsyntax.com",
    githubUrl: "https://github.com/maskedsyntax",
  },

  buildNotes: {
    title: "Build notes",
    description:
      "Long-form write-ups from the lab: what was tried, what broke, and what stuck. Heavy on code and sketches.",
    archiveLabel: "Read all build notes",
  },
} as const;
