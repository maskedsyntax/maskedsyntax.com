---
title: "Crunch: Bit-Packed I/O for Tight Loops"
date: "2025-10-20"
tags: ["systems", "rust", "serialization"]
summary: "I was serializing millions of small flags as bytes. Packing bits cut disk and cache pressure — at the cost of trickier debugging."
reading_time: "13 min"
---

When your dataset is mostly **booleans**, byte-wise storage is **8×** wasteful on paper — and worse in practice because caches see more footprint than necessary. Crunch was my experiment in **bit-packed** columns with sane boundaries for decoding.

## Layout intuition

```text
byte-oriented:  [ff][00][ff]...   (1 bool per byte)
bit-oriented:   [10110011]...     (8 bools per byte)
```

You trade CPU bit-twiddling for bandwidth — usually worth it at scale.

## Reading / writing

Core operations:

```text
index i ──► byte i/8, bit i%8
mask / shift ──► bool
```

Bulk operations can use **u64** words — fewer shifts per element.

## Rust-flavored getters/setters

```rust
fn get_bit(buf: &[u8], i: usize) -> bool {
    let byte = i / 8;
    let bit = i % 8;
    (buf[byte] & (1 << bit)) != 0
}

fn set_bit(buf: &mut [u8], i: usize, on: bool) {
    let byte = i / 8;
    let bit = i % 8;
    if on {
        buf[byte] |= 1 << bit;
    } else {
        buf[byte] &= !(1 << bit);
    }
}
```

I unit-test `get_bit(set_bit(x)) == x` on random indices before I trust bulk paths.

## Debugging aids

Bitfields are **opaque** when wrong. I kept a **debug mode** that expands to bool vectors for asserts:

```text
release: bit-packed
debug:   optional shadow Vec<bool> to cross-check
```

## Learnings

- Alignment and endianness still matter at boundaries — document your on-disk format.
- SIMD can help **bulk** popcount / compare — only after correctness.
- Prefer **stable, versioned** containers — future you migrates schemas.

Compression isn’t always about gzip — sometimes it’s **not wasting bits** in the first place.
