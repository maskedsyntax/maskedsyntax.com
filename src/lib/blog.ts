import MarkdownIt from "markdown-it";
import { escapeHtml, unescapeAll } from "markdown-it/lib/common/utils.mjs";
import type { BlogPostMeta } from "../types";
import { highlightCode } from "./md-highlight";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
  highlight(str, lang) {
    return highlightCode(str, lang);
  },
});

md.renderer.rules.fence = (tokens, idx, options, _env, _slf) => {
  const token = tokens[idx];
  if (!token) {
    return "";
  }
  const info = token.info ? unescapeAll(token.info).trim() : "";
  let langName = "";
  if (info) {
    const arr = info.split(/(\s+)/g);
    langName = arr[0] ?? "";
  }

  let highlighted: string;
  if (options.highlight) {
    highlighted =
      options.highlight(token.content, langName, info.split(/\s+/).slice(2).join(" ")) ||
      escapeHtml(token.content);
  } else {
    highlighted = escapeHtml(token.content);
  }

  if (highlighted.indexOf("<pre") === 0) {
    return `${highlighted}\n`;
  }

  const langPrefix = options.langPrefix ?? "language-";
  let codeClass = "hljs";
  if (info && langName) {
    codeClass += ` ${langPrefix}${escapeHtml(langName)}`;
  }

  return `<pre class="hljs"><code class="${codeClass}">${highlighted}</code></pre>\n`;
};

const modules = import.meta.glob("/blog/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

type ParsedPost = BlogPostMeta & { content: string };

type Frontmatter = {
  title?: string;
  date?: string;
  tags?: string[];
  summary?: string;
  reading_time?: string;
};

function parseFrontmatter(raw: string): { data: Frontmatter; content: string } {
  if (!raw.startsWith("---\n")) {
    return { data: {}, content: raw };
  }

  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) {
    return { data: {}, content: raw };
  }

  const header = raw.slice(4, end);
  const content = raw.slice(end + 5);
  const data: Frontmatter = {};

  for (const line of header.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf(":");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (key === "tags") {
      if (value.startsWith("[") && value.endsWith("]")) {
        try {
          const parsed = JSON.parse(value) as unknown;
          data.tags = Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
          data.tags = value
            .slice(1, -1)
            .split(",")
            .map((v) => v.trim().replace(/^["']|["']$/g, ""))
            .filter(Boolean);
        }
      } else {
        data.tags = [];
      }
      continue;
    }

    const normalized = value.replace(/^["']|["']$/g, "");
    if (key === "title") data.title = normalized;
    if (key === "date") data.date = normalized;
    if (key === "summary") data.summary = normalized;
    if (key === "reading_time") data.reading_time = normalized;
  }

  return { data, content };
}

const posts: ParsedPost[] = Object.entries(modules)
  .map(([path, raw]) => {
    const { data, content } = parseFrontmatter(raw);
    const chunks = path.split("/");
    const slug = (chunks[chunks.length - 1] ?? "").replace(".md", "");
    const category = path.includes("/ml/")
      ? "ml"
      : path.includes("/systems/")
        ? "systems"
        : path.includes("/devtools/")
          ? "devtools"
          : "experiments";

    return {
      title: String(data.title ?? slug),
      slug,
      date: String(data.date ?? ""),
      tags: (data.tags as string[]) ?? [],
      summary: String(data.summary ?? ""),
      readingTime: String(data.reading_time ?? "8 min"),
      category,
      content: md.render(content),
    } satisfies ParsedPost;
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getAllPosts() {
  return posts.map(({ content, ...meta }) => meta);
}

export function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug);
}
