---
title: "Markd: Search-First Static Notes"
date: "2026-02-14"
tags: ["systems", "rust", "notes", "static-site"]
summary: "Notes apps love databases. I wanted folders of markdown, a compiler, and search that felt instant — Tantivy was the fun part."
reading_time: "16 min"
---

I take a lot of markdown notes. Not “second brain influencer” volume — enough that **grep across files** stopped scaling emotionally. I wanted:

- plain files on disk (no lock-in),
- rebuild on save,
- **search** that understood words, not just substrings.

Markd is basically that pipeline in Rust.

## Architecture I keep redrawing

```text
  notes/**/*.md
        │
        ▼
   watcher / build
        │
        ├──────────────┐
        ▼              ▼
   static HTML     Tantivy index
        │              │
        └──────┬───────┘
               ▼
          local site + /search
```

The trick is treating the index as a **first-class artifact** next to HTML, not an afterthought.

## Why Tantivy?

It’s embeddable, fast, and doesn’t require standing up Elasticsearch for a personal knowledge base. You trade ops complexity for **linking a crate** — acceptable for this scope.

Rough indexing flow:

```text
for doc in parse_markdown_files() {
    index.add_document(doc.id, doc.title, doc.body_text);
}
commit();
```

(Search query side is standard BM25-ish scoring — the magic is **having** the index at all.)

## Indexing code shape (Tantivy-flavored pseudocode)

```rust
use tantivy::schema::*;
use tantivy::{Index, IndexWriter};

fn build_schema() -> Schema {
    let mut sb = Schema::builder();
    sb.add_text_field("title", TEXT | STORED);
    sb.add_text_field("body", TEXT);
    sb.add_text_field("path", STRING | STORED);
    sb.build()
}

fn index_note(writer: &mut IndexWriter, path: &str, title: &str, body: &str) -> tantivy::Result<()> {
    let mut doc = Document::default();
    doc.add_text("path", path);
    doc.add_text("title", title);
    doc.add_text("body", body);
    writer.add_document(doc)?;
    Ok(())
}
```

Reality adds tokenizers, frontmatter stripping, and incremental deletes — but the **schema first** workflow matches how I think about notes.

## Templates without a framework cult

Tera (or similar) keeps HTML boring. The goal is **predictable output** — fancy components don’t help when you’re debugging why a heading anchor broke.

## Failure modes

- Huge attachments in markdown → index bloat. Mitigation: strip code blocks vs body depending on mode.
- Watch mode + editor auto-save → rebuild storms. Debounce like a civilized person.
- Unicode normalization — filenames vs slugs vs search tokens must agree.

## Learnings

- If search is slow, people stop trusting the vault — **index locally**, aggressively.
- Static output + local index = **offline by default**, which matches how I actually work.
- “Compiler for notes” is a mindset: errors should be **actionable** (“broken link to X”), not stack traces.

Still iterating on nicer nav and graph views — but search-first indexing is the spine.
