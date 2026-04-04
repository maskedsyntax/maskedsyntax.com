---
title: "BraveSync Lite: encrypt before GitHub sees bytes"
date: "2026-02-20"
tags: ["devtools", "go", "security", "encryption"]
summary: "A private repo still leaves bytes readable in history. This tool is the smallest envelope I trusted for browser profile blobs on Git."
reading_time: "5 min"
---

![Encryption Pipeline](/images/blog/bravesync-pipeline.svg)

I wanted backups that could sit in a GitHub repo without shipping plaintext browser profiles. I already sync with Git; I needed ciphertext at rest in history instead of another hosted vault and login. **Forks happen, visibility toggles happen, and laptops get stolen**, and those are the failure modes I designed for. BraveSync Lite is a small Go utility that encrypts before bytes leave the machine: random salt, random nonce, Argon2id to stretch a passphrase, AES-256-GCM to authenticate ciphertext. The host sees opaque blobs. That is **client-side encryption** in the plain English sense. It is not a formal zero-knowledge proof system. Vendors blur those phrases; I try not to.

## The envelope

`Encrypt` generates salt and nonce from `crypto/rand`, derives a thirty-two byte key, seals with GCM, and concatenates `salt || nonce || ciphertext` (tag included because `Seal` appends it). `Decrypt` checks lengths, slices, derives the same key, and `Open`s. Tampering fails at authentication, not later as subtle corruption.

```go
func Encrypt(plaintext []byte, password string) ([]byte, error) {
    salt := make([]byte, SaltLen)
    if _, err := io.ReadFull(rand.Reader, salt); err != nil {
        return nil, fmt.Errorf("failed to generate salt: %w", err)
    }

    key := deriveKey([]byte(password), salt)
    defer utils.ZeroMem(key)

    block, err := aes.NewCipher(key)
    if err != nil {
        return nil, fmt.Errorf("failed to create cipher: %w", err)
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, fmt.Errorf("failed to create gcm: %w", err)
    }

    nonce := make([]byte, NonceLen)
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return nil, fmt.Errorf("failed to generate nonce: %w", err)
    }

    ciphertext := gcm.Seal(nil, nonce, plaintext, nil)

    result := append(salt, nonce...)
    result = append(result, ciphertext...)

    return result, nil
}
```

Constants are boring on purpose: sixteen-byte salt, twelve-byte nonce, Argon2 time one, sixty-four KiB memory, four threads. More work hardens offline guessing and hurts laptops; less work feels irresponsible for passphrases humans actually type. `ZeroMem` on the derived key is hygiene, not a guarantee against every memory attack. It still beats leaving keys in heap pages forever.

## Threat model without theater

This stops casual reads of repo contents. It does not stop someone who has your passphrase, your unlocked session, or a keylogger. It does not fix bad access control. Encryption makes some mistakes hurt less; it does not replace policy.

Passphrase loss equals data loss. I say that in help text because someone will ignore it once and learn the hard way. Restore prompts through TUI helpers so echo is off; I snapshot destination profile dirs before unattended scripts overwrite anything. Large trees may split into chunk blobs so diffs stay smaller; manifests record names and hashes. Rotation would mean new salts and re-encrypting everything; I have not automated that because this is still primarily a personal safety net.

## CLI shape

`cmd/config.go` uses `urfave/cli` to capture paths and tokens and persist settings. Tokens belong in env when automation allows, not only in files. `cmd/backup` walks configured paths, encrypts payloads, pushes through the GitHub API wrapper. `cmd/restore` reverses after passphrase entry. I sanity-check ciphertext SHAs between runs when scripts go quiet; silent no-ops usually mean filters excluded the world.

Git LFS may matter for huge blobs depending on host limits. Regular git is fine for smallish secrets. Naming in the slug still says "zero-knowledge" for history; the body prefers accurate words so nobody expects zk-SNARKs.

The internal archive layer walks trees, applies ignore rules, and hands byte slices to `encryption.Encrypt`. Tar or zip wrapping is optional depending on tag; the prototype bias is "one ciphertext blob per top-level folder" so failures localize instead of corrupting a monolith. Auditing scripts diff commit SHAs before and after runs because the worst failure mode is a green CI job that pushed nothing.

I still treat GitHub as "convenient blob storage with history," not as the trust root. Encryption is a seatbelt for the repo; access control and device hygiene are still the steering wheel.

`Decrypt` failures surface as authentication errors, not as garbage profiles silently written to disk. I would rather the tool be loud and useless than polite and corrupt.

Restore paths print overwrite warnings on purpose. Browser profiles are not merge-friendly artifacts; clobbering without a prompt is how you learn about backups the expensive way.

## After

If this ever leaves my machine, the next bar is boring tests: decrypt vectors generated on another OS, documented rotation, maybe recovery keys. Today it is the minimum envelope I still call trustworthy, not a finished product.
