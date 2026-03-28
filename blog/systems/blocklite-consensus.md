---
title: "BlockLite: ValidChain and longest chain rule"
date: "2025-09-22"
tags: ["systems", "go", "blockchain"]
summary: "Educational MaskedCoins code in Go: PoW links blocks, ECDSA signs transfers, ValidChain walks the chain and verifies proofs plus signatures."
reading_time: "5 min"
---

BlockLite is a teaching blockchain in Go with JSON persistence, a mutex-protected struct, and HTTP APIs via Gin. I treat it as a readable reference for how pieces fit: transactions accumulate, mining finds a proof, `CreateBlock` appends and saves. Consensus for conflicts is **longest valid chain** as described in the README. The name ties to my handle; the economics mirror Bitcoin's early subsidy only loosely. This is pedagogy, not investment advice.

## What `ValidChain` actually checks

`ValidChain` returns false on empty input, then walks forward. Hash links must match. Proof-of-work must advance correctly from the previous block's proof. User transactions must verify with the wallet package; coinbase sends use sender `"0"` and skip signature checks.

```go
func (bc *Blockchain) ValidChain(chain []Block) bool {
    if len(chain) == 0 {
        return false
    }

    previousBlock := chain[0]
    currentIndex := 1

    for currentIndex < len(chain) {
        block := chain[currentIndex]

        if block.PreviousHash != previousBlock.CalculateHash() {
            return false
        }

        if valid, _ := VerifyProof(block.Proof, previousBlock.Proof); !valid {
            return false
        }

        for _, tx := range block.Transactions {
            if tx.Sender != "0" {
                data := tx.Sender + tx.Receiver + strconv.FormatFloat(tx.Amount, 'f', -1, 64)
                if !wallet.Verify(tx.Sender, data, tx.Signature) {
                    return false
                }
            }
        }

        previousBlock = block
        currentIndex++
    }

    return true
}
```

Each `Block` carries index, timestamp, transactions, proof, and previous hash. `CalculateHash` serializes those fields for mining. Changing serialization invalidates historical chains, so the format is versioned informally by assignment year. Struct tags map to `json` keys for persistence; renaming fields without migration logic is how students learn that pain once per semester.

## Mining, blocks, and persistence

`CreateBlock` locks the mutex, copies pending transactions into a new block, clears the mempool slice, appends to chain, and calls `Save` so a crash does not lose the whole session. Tests swap `timeNow` for deterministic timestamps.

```go
func (bc *Blockchain) CreateBlock(proof int, previousHash string) Block {
    bc.mux.Lock()
    defer bc.mux.Unlock()

    block := Block{
        Index:        len(bc.Chain) + 1,
        Timestamp:    timeNow().UTC().Format(time.RFC3339),
        Transactions: bc.CurrentTransactions,
        Proof:        proof,
        PreviousHash: previousHash,
    }

    bc.CurrentTransactions = []Transaction{}
    bc.Chain = append(bc.Chain, block)

    _ = bc.Save(BlockchainFile)

    return block
}
```

Mining searches for a proof whose hash with the previous proof starts with four hex zeros. `ProofOfWork` brute-forces integers until `VerifyProof` passes. Difficulty is literally the `"0000"` prefix: easy for demos, useless against attackers. Parallel mining would mean coordinating nonces; the educational code stays single-threaded per miner.

```go
func VerifyProof(proof, lastProof int) (bool, string) {
    blockData := strconv.Itoa(proof) + strconv.Itoa(lastProof)
    hashedData := utils.SHA256(blockData)
    hashHex := hex.EncodeToString(hashedData[:])
    return hashHex[:4] == "0000", hashHex
}
```

Mining reward is a constant fifty coins. `GetBalance` walks history; that is expensive but transparent for learners. `blockchain.json` is plain JSON so students can open it after a mine. Pretty-printing costs space but wins demos; compaction is a one-line change when files grow. For class demos I sometimes truncate the printed chain in slides and link to the raw JSON instead.

## HTTP, wallet, mempool, and sync

Gin handlers wrap mutex acquisition around chain reads and writes. Contention shows up under load tests with concurrent miners; for classroom usage it is fine. Handlers return JSON errors when signatures fail or balances are insufficient; the chain stays unchanged on rejection.

`AddTransaction` rejects spends that exceed computed balance. The mempool is in-memory only; restarting drops pending transfers unless you persist elsewhere. That limitation is intentional for clarity.

`wallet.NewWallet` generates ECDSA keys, hex-encodes public keys as addresses, and signs concatenated sender, receiver, and amount strings. Verification hashes the same payload. Changing string formatting breaks old signatures, so the format is part of the protocol.

Nodes register peers over HTTP. When chains disagree, the API compares length and `ValidChain`, then replaces state with the longest valid option. That is the textbook rule for this toy; production networks add finality and economic assumptions this code ignores.

## Tests and how to read the tree

`blockchain_test.go` covers `CreateBlock`, `ProofOfWork`, tampered transactions, and persistence round-trips. When I change signature canonicalization, tests break first, which is how I want it. `go run .` starts the API with persistence to `blockchain.json`. Mining endpoints burn CPU on purpose.

## After

BlockLite is not production crypto. It is a **coherent layout** of structs and checks you can grep. When I need to explain PoW or signatures, I open `blockchain.go` and `wallet.go` side by side.

Students who try to "optimize" balance calculation with a cache learn why the reference walks the chain: transparency beats cleverness in a teaching repo. The slow code is the pedagogy.

JSON on disk makes it obvious when someone hand-edits a hash to cheat the assignment. That social dynamic is half the lesson: integrity checks exist because bytes lie.
