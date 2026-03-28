---
title: "Markd: Tantivy schema and notify watcher"
date: "2026-02-14"
tags: ["systems", "rust", "notes", "static-site"]
summary: "I wanted notes on disk, HTML in a folder, and search that did not phone home. Markd is the compiler-shaped answer, with all the rough edges of a tool I actually use."
reading_time: "5 min"
---

The uncomfortable truth about "second brain" apps is that the part I care about is **grep with ranking**. Pretty graphs and sync icons are optional. Markdown on disk is portable; everything else is an artifact I should be able to delete and rebuild. Markd is that rebuild loop: walk `.md`, emit HTML, keep a Tantivy index next to the output so a static `/search` page can score bodies and titles without a server process.

I did not set out to beat Obsidian. I set out to own the pipeline. When the indexer is slow, I want it to be **my** slow, with knobs I can find in `indexer.rs` instead of a black box.

## Why the index looks boring on purpose

Tantivy gets a tiny schema: `title` and `body` for text, `path` stored so the UI can link back to a page. The indexer opens or creates an mmap-backed directory, builds fields once, and exposes `index_document` for "replace this note's row." The prototype opens a writer per document, commits, and closes. That is the wrong shape for a ten-thousand-file vault and the right shape for "make it work tonight."

```rust
pub fn index_document(&self, title: &str, body: &str, path: &str) -> Result<()> {
    let mut index_writer: IndexWriter = self.index.writer(50_000_000)?;
    index_writer.add_document(doc!(
        self.title => title,
        self.body => body,
        self.path => path,
    ))?;
    index_writer.commit()?;
    Ok(())
}
```

Fifty megabytes of writer RAM is a starting guess. Batching, deletes, and content-hash IDs are the future chapter. Today I accept rebuild cost because **stale search** feels worse than a few seconds of indexing when I know I just saved a file.

The schema constructor in `MarkdIndexer::new` is the other half: `TEXT | STORED` on title, `TEXT` on body, `STORED` on path. If titles should outrank bodies, boosting is a one-line schema tweak later, not a redesign.

## Watch mode is the product

`notify` watches the source tree recursively. When any path ends in `.md`, I run `build_all` again. That is the entire UX contract for local editing: save, refresh browser, see HTML. Filtering to markdown avoids rebuild storms from editor temps; debouncing is still on the list for the IDE that writes twice per save.

```rust
pub fn watch(&self, source_dir: &Path, output_dir: &Path) -> Result<()> {
    let (tx, rx) = channel();
    let mut watcher = RecommendedWatcher::new(tx, Config::default())?;
    watcher.watch(source_dir, RecursiveMode::Recursive)?;

    loop {
        match rx.recv() {
            Ok(Ok(event)) => {
                if self.is_relevant_event(&event) {
                    if let Err(e) = self.compiler.build_all(source_dir, output_dir) {
                        eprintln!("Build error: {}", e);
                    }
                }
            }
            Ok(Err(e)) => eprintln!("Watch error: {:?}", e),
            Err(e) => eprintln!("Channel error: {:?}", e),
        }
    }
}
```

The compiler strips YAML frontmatter before indexing so searches do not spam matches on duplicated `title:` lines. `pulldown-cmark` runs with tables, footnotes, task lists, and strikethrough enabled; HTML lands in Tera templates. Broken templates fail loudly with line numbers, which saved me more than once from shipping empty pages.

The honest limitation: **template edits need a watch restart** unless I extend `is_relevant_event` to notice `.html` partials under `templates/`. I have kicked that can down the road because I change notes more often than I change layout.

## Query side and posture

Search handlers parse against the same fields the indexer wrote. BM25 is the default ranking; tuning is mostly "do titles matter more than mentions in body," which is a product question, not a CS breakthrough.

Local-first search means no remote analytics. If you mirror the built site publicly, remember the index may expose titles you thought were private unless you exclude paths at build time. That is not paranoia; it is filesystem semantics.

`notify` picks FSEvents on macOS and inotify on Linux; WSL friends have needed polling-style config before. Documenting that once saved someone an afternoon of "watch does nothing" confusion. Link checking inside the compiler is still wishlist work: today I grep for broken internal links when guilt outweighs laziness.

The library binary in `lib.rs` and the CLI in `main.rs` split intentionally: tests hit the library API without spawning subprocesses, and I can embed Markd in other tools later without copy-pasting compiler code. That separation paid for itself the first time a unit test caught a regression in frontmatter stripping.

## After

Markd's bet is still the same: **files are source of truth, the index is derived**. If lookup feels slow, regenerate aggressively and fix the writer batching when it annoys you enough. I reach for this when I want grep-with-ranking on a folder I control, not when I want a hosted SaaS. The code reads like that priority order.
