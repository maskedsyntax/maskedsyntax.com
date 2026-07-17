import { site } from "../data/site";

export const SITE_URL = "https://maskedsyntax.com";

export type PageMeta = {
  title?: string;
  description?: string;
  path?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
};

const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function applyPageMeta(meta: PageMeta = {}) {
  const pageTitle = meta.title?.trim();
  const documentTitle = pageTitle ? `${pageTitle} · ${site.brand.wordmark}` : site.brand.wordmark;
  const description = meta.description?.trim() || site.brand.tagline;
  const path = meta.path ?? window.location.pathname;
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  const ogType = meta.ogType ?? "website";

  document.title = documentTitle;

  upsertMeta("name", "description", description);
  upsertMeta("name", "robots", meta.noIndex ? "noindex, nofollow" : "index, follow");

  upsertLink("canonical", url);

  upsertMeta("property", "og:site_name", site.brand.wordmark);
  upsertMeta("property", "og:title", documentTitle);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:type", ogType);
  upsertMeta("property", "og:image", DEFAULT_OG_IMAGE);
  upsertMeta("property", "og:locale", "en_US");

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", documentTitle);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", DEFAULT_OG_IMAGE);
}

export function metaForPath(path: string, slug?: string): PageMeta {
  if (path === "/") {
    return {
      path: "/",
      description: site.brand.tagline,
    };
  }

  if (path === "/about") {
    return {
      title: "About",
      description: "About the builder behind MaskedSyntax.",
      path: "/about",
    };
  }

  if (path === "/blog") {
    return {
      title: site.buildNotes.title,
      description: site.buildNotes.description,
      path: "/blog",
    };
  }

  if (path.startsWith("/blog/") && slug) {
    return { path };
  }

  return { path, noIndex: true };
}
