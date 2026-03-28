---
title: "Crunch: BitReader and BitWriter around Huffman and LZ77"
date: "2025-10-20"
tags: ["systems", "rust", "compression", "io"]
summary: "Crunch is a small Rust archive experiment. The part I kept re-reading was bit_io.rs: how to stream codes without allocating a string of ones and zeros per symbol."
reading_time: "5 min"
---

Before I touched Huffman tables or LZ77 windows, I needed one boring primitive: **read and write bits** on top of `std::io::Read` and `Write`. Bytes are easy. Variable-length codes are not. Crunch lives in my repo as a learning compressor; this note is about the bit layer that everything else sits on, and how the rest of the crate hangs off it without turning into a README full of one-line headings.

## Why not pack bits into a `Vec<bool>`?

You could. For a homework-sized input it is fine. For anything larger you pay eight times the cache footprint of a tight bitset, and you still have to serialize to bytes at the end. The `BitWriter` in the crate keeps a single byte buffer, fills MSB first, and only touches the inner writer when a byte completes.

```rust
pub fn write_bit(&mut self, bit: bool) -> io::Result<()> {
    if bit {
        self.buffer |= 1 << (7 - self.bits_count);
    }
    self.bits_count += 1;

    if self.bits_count == 8 {
        self.inner.write_all(&[self.buffer])?;
        self.buffer = 0;
        self.bits_count = 0;
    }
    Ok(())
}
```

`write_bits` peels a `u64` from the high end down so Huffman and fixed-width fields share the same path:

```rust
pub fn write_bits(&mut self, value: u64, count: u8) -> io::Result<()> {
    for i in (0..count).rev() {
        let bit = (value >> i) & 1 == 1;
        self.write_bit(bit)?;
    }
    Ok(())
}
```

`flush_bits` pads the final partial byte with zeros. That padding is part of the on-disk contract: decoders must know when the stream ends, usually via an explicit length or an end-of-block symbol higher up. If you ever embed this style of codec in a network protocol, **frame bitstreams with explicit lengths**; relying on EOF alone is fragile across message boundaries, and future you will thank present you for not pretending one TCP read equals one logical block.

## Reading, EOF, and the corruption story

`BitReader` mirrors the writer. When the local buffer is empty it pulls one byte from the inner reader. I use `io::Result` end to end: real IO errors propagate, while `UnexpectedEof` in the middle of a bit stream becomes `Ok(None)` from `read_bit` so callers can stop without conflating "broken disk" with "clean end." Truncated archives surface the same way: `read_bit` returns `None`, higher layers bubble that into `UnexpectedEof`, and the CLI should map it to a plain "truncated file" string for humans. The bug class I wanted to avoid was MSB versus LSB drift: I consume bits from the **top** of the buffer byte to match the writer's MSB-first convention. Mixing endianness between writer and reader is the fastest way to get plausible-looking garbage that only fails on large inputs.

```rust
pub fn read_bit(&mut self) -> io::Result<Option<bool>> {
    if self.bits_count == 0 {
        let mut buf = [0u8; 1];
        match self.inner.read_exact(&mut buf) {
            Ok(_) => {
                self.buffer = buf[0];
                self.bits_count = 8;
            }
            Err(ref e) if e.kind() == io::ErrorKind::UnexpectedEof => return Ok(None),
            Err(e) => return Err(e),
        }
    }

    let bit = (self.buffer >> (self.bits_count - 1)) & 1 == 1;
    self.bits_count -= 1;
    Ok(Some(bit))
}
```

Document MSB-first versus LSB-first in a comment at the top of `bit_io.rs`. Future you will forget, and the tests are the only safety net.

## Tests, cursors, and where fuzz would go

The module ships with a round-trip test using an in-memory `Cursor` over `Vec<u8>` so the bit layer never needs temp files. It writes single bits, a packed `u64` field, flushes, then reads back until EOF returns `None`:

```rust
let mut writer = BitWriter::new(&mut buffer);
writer.write_bit(true)?;
writer.write_bit(false)?;
writer.write_bits(0b101, 3)?;
writer.flush_bits()?;

let mut reader = BitReader::new(Cursor::new(buffer));
assert_eq!(reader.read_bit()?, Some(true));
// ...
```

Whenever I change shift direction or padding, this test breaks first. That is the point. Hand-picked patterns cover the cases I already thought of; a future `cargo fuzz` target would throw random bit patterns through writer and reader to shake out the ones I did not. I have not wired that yet because the educational scope stayed small.

## How the rest of the crate uses the same stream

Huffman emits variable bit patterns; LZ77 emits `(distance, length)` tuples that then get entropy coded. Without a shared bit stream type, each stage would reinvent partial-byte buffering. Keeping `BitReader`/`BitWriter` generic over `R: Read` and `W: Write` meant I could test against `Cursor<&[u8]>` and pipe real files without extra copies. In the repo, data flows from **`bit_io.rs`** into **`huffman.rs`** and **`lz77.rs`**, then **`archive.rs`** adds length-prefixed chunks so multiple files live in one blob. Headers that carry those lengths use little-endian `u64` in my experiments; the bit layer stays byte-oriented, and anything wider than a byte is documented next to the archive format, not hidden inside the bit shifts.

`main.rs` stays a thin CLI over compress and decompress. Integration tests round-trip random bytes end to end. `benchmark.rs` compares this toy against gzip on sample corpora; you should expect to lose to zlib. The point is seeing **where** time goes, not winning a ratio contest.

## After I stopped coding for a night

Bit-level bugs are invisible in hex dumps. When something slipped, I added a `debug` feature in higher layers that dumps the next N bits as `0`/`1` text. That is slow, but it sits **above** this type, not inside the hot path. Arithmetic coding would tighten ratios further and make debugging miserable; I am keeping the scope educational on purpose.

If you borrow the pattern, treat the bit types as the spine and keep archive framing explicit. Everything else is Huffman and LZ77 textbook material with a little Rust IO glue.
