# copium.fun — Pulse Settlement

**Track 1:** Prediction Markets and Settlement · $18,000

Every World Cup moment becomes a **90-second YES/NO pool** on Solana, with TxLINE odds locked at open and **permissionless settlement** via `txoracle`.

## Demo

- **Live:** https://copium.fun/proof/{pulseId}
- **Simulator:** https://copium.fun/sim/{sessionId}
- **Video:** see repo `BRAND-DOC.md` §17A

## What to look at

- `programs/copium-pulses` — Anchor program
- `packages/settlement` — lock, validate, crank (internal)
- `apps/settlement-worker` — truth + crank jobs
- `apps/web/app/proof/[pulseId]` — proof UI + bundle download

## One-liner

> Goal. Pulse opens. Odds locked to messageId. Whistle. validate_stat. Crank. Download proof.

Built on [TxODDS TxLINE](https://txodds.net/our-products/tx-line/) · Solana World Cup Hackathon 2026
