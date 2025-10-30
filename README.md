# CanvasCloak

A privacy‑preserving art contest built on Zama FHEVM

CanvasCloak enables artists to submit works and receive private jury scoring on‑chain. Using Fully Homomorphic Encryption (FHE) with Zama FHEVM, submissions and scores remain encrypted during processing; only final leaderboards are revealed and publicly verifiable.

—

Value Proposition (one page)
- For creators: impartial scoring without public exposure of raw jury notes
- For juries: evaluate privately; publish verifiable results
- For organizers: on‑chain auditability without leaking sensitive judging data
- For audience: transparent winners; private intermediate signals

—

Actors & Responsibilities
- Artist: encrypts artwork hash/metadata; submits ciphertext
- Jury: encrypts per‑category scores; submits ciphertext
- Orchestrator: opens/closes rounds; triggers homomorphic tally
- Verifier (anyone): checks proof artifacts and final leaderboard integrity

—

Swimlane (high‑level)
```
Artist     → encrypt(meta) ──submit────┐
Jury       → encrypt(score) ─submit──┐  │
Orchestr.  open → close → tally(FHEVM) │ → reveal → publish
Verifier   ←────────── verify artifacts ┘
```

—

Data Model (encrypted unless noted)
- artworkMeta: CID/hash, category, owner (public owner address only)
- juryScore: vector per rubric (composition, technique, originality)
- tallyVector: homomorphic sum of scores
- leaderboard: public top‑N with ties resolved by policy

—

Operational Policies
- Key management: per‑round FHE public key; private key under threshold custody
- Conflict of interest: optional allowlist/denylist (public)
- Late submissions: grace windows configurable (public)
- Audit artifacts: emitted proof hashes bound to round id

—

Risk Register (sample)
- Metadata linkage via mempool timing → use relayers and batch windows
- Score inflation by colluding juries → weight caps and anomaly detection
- Key compromise at reveal → rotate keys, invalidate reveal, re‑tally

—

KPIs
- Time‑to‑result (tally latency)
- Cost per homomorphic op (gas)
- Jury participation rate
- Dispute rate per round

—

API Sketch
- submitArtwork(bytes cipherMeta)
- submitScore(uint artworkId, bytes cipherScore)
- closeRound()
- tally()
- reveal(bytes result, bytes proofs)
- artifacts(uint roundId) → bytes

—

Roadmap
- Q1: Encrypted submissions, jury scoring, FHE tally (Zama FHEVM)
- Q2: Category weights, tie‑break policies, dispute window
- Q3: Cross‑round rankings, curator badges, programmable bounties
- Q4: Cross‑chain galleries, IPFS pinning SLAs, curator DAOs

—

Runbook (condensed)
- Rotate FHE keys per round; store private fragments offline/threshold
- Batch submissions via relayer to reduce linkage
- Pin artifacts and leaderboard snapshots; publish hashes on‑chain

—

FAQ
- Why Zama FHEVM?
  - It lets EVM contracts aggregate scores over ciphertexts, keeping judging private while results are auditable.
- Can images be encrypted on‑chain?
  - Store images off‑chain (IPFS/S3); submit encrypted hashes/metadata on‑chain.
- How do I verify results?
  - Fetch artifacts(roundId) and recompute checks against event commitments.

—

License & Credits
MIT. Built with Zama FHEVM and open cryptography.
