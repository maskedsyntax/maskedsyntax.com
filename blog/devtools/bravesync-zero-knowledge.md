---
title: "BraveSync Lite: Zero-Knowledge Browser Backup"
date: "2026-02-20"
tags: ["devtools", "go", "security", "encryption"]
summary: "I wanted cloud-shaped sync without handing plaintext to a server I don't run. Argon2 + AES-GCM + a private GitHub repo was the smallest story I could trust."
reading_time: "17 min"
---

![Encryption Pipeline](/images/blog/bravesync-pipeline.svg)

“Just sync my bookmarks” sounds easy until you decide **the server is untrusted**. I wasn’t trying to invent a new crypto primitive — I wanted a boring pipeline:

1. Derive keys from a passphrase **client-side only**.
2. Encrypt blobs before they ever leave the machine.
3. Push ciphertext to a dumb remote (GitHub API in my prototype).

## Threat model (honest version)

- Protect data **at rest** on GitHub from casual reads.
- Protect against **accidental** leaks (misconfigured repo, fork confusion).
- Not trying to defeat a nation-state — just **raise the bar** above “grep the API.”

## KDF + AEAD shape

```text
passphrase ──► Argon2id ──► key material ──► AES-256-GCM ──► ciphertext
                     │                              │
                     └── salt stored alongside ─────┘
```

Argon2id because it’s the modern default for password-derived keys. AES-GCM because it’s **authenticated** — tampering fails loudly.

## What the Go side roughly looks like

Conceptually:

```go
salt := make([]byte, 16)
rand.Read(salt)

key := argon2.IDKey([]byte(passphrase), salt, 3, 64*1024, 4, 32)
block, _ := aes.NewCipher(key)
gcm, _ := cipher.NewGCM(block)
nonce := make([]byte, gcm.NonceSize())
rand.Read(nonce)

ct := gcm.Seal(nil, nonce, plaintext, nil)
// persist: salt || nonce || ct
```

(Real code wires errors, chunking, and manifest files — the idea is the envelope.)

## Decrypt path (symmetric)

```go
func decrypt(passphrase string, salt, nonce, ct []byte) ([]byte, error) {
    key := argon2.IDKey([]byte(passphrase), salt, 3, 64*1024, 4, 32)
    block, err := aes.NewCipher(key)
    if err != nil {
        return nil, err
    }
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }
    return gcm.Open(nil, nonce, ct, nil)
}
```

On disk I store `salt || nonce || ciphertext` in a single blob per object — parsers are tedious but **debuggable**.

## Why GitHub?

It’s a **dumb blob store with history** I already have API keys for. The sync tool never needs plaintext on the remote — only ciphertext commits.

## Footguns I stepped on

- Reusing nonces with GCM is catastrophic — **random nonces** per object.
- Argon2 params must be tuned to your machine — too aggressive and backups feel “broken.”
- Restoring is UX-hard: people forget **passphrases** more often than crypto breaks.

## Learnings

- “Zero-knowledge” in marketing ≠ formal ZK proofs. Here it means **keys never leave the client**.
- Crypto UX is the hard part: rotation, recovery, and “what if I lose my laptop?”
- Pipelines are easier to trust when you can draw them on one screen — hence the diagram.

I’d still add hardware keys or a real recovery story before I’d recommend this to non-me users — but as a learning project, the pipeline **made sense**.
