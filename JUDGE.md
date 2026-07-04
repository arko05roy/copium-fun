# Judge guide — copium.fun

**Devnet only.** Phantom → Devnet. No payment required. No FIFA marks.

Three separate products from one Pulse engine. Pick your track:

| Track | Entry URL | Video script |
|-------|-----------|--------------|
| 1 — Settlement | `/proof/{pulseId}` | BRAND-DOC §17A |
| 2 — Agent Desk | `/desk` | BRAND-DOC §17B |
| 3 — Match Feed | mobile app + `/room/demo` | BRAND-DOC §17C |

Run `pnpm verify:d21` for full dev ship checklist.

---

## Deploy (web)

```bash
# Vercel — set root directory to apps/web
# Env: NEXT_PUBLIC_SITE_URL, SUPABASE_*, TXLINE_API_TOKEN, etc. (.env.example)
vercel --cwd apps/web
```

Set `NEXT_PUBLIC_SITE_URL` to production URL so receipt OG + Blinks resolve correctly.

---

## Mobile binary (Track 3 judges)

```bash
cd apps/mobile
npm i -g eas-cli
eas login
eas init   # once — writes projectId to app.json
EXPO_PUBLIC_WEB_URL=https://copium.fun pnpm build:apk   # Android APK (preview profile)
# pnpm build:ios   # TestFlight (preview profile) — needs Apple dev account
```

Paste APK/TestFlight link here after build: _TBD_

Local dev (no binary):

```bash
EXPO_PUBLIC_WEB_URL=http://127.0.0.1:3000 pnpm --filter @copium/mobile start
```

---

## Track 1 — Pulse Settlement (~5 min)

**URL:** `https://copium.fun/proof/{pulseId}` (local: `http://127.0.0.1:3000/proof/{pulseId}`)  
**Video:** matches BRAND-DOC §17A (settlement only)

1. Optional: `/sim/{sessionId}` — advance fixture to goal event
2. Open `/proof/{pulseId}` — locked TxLINE `messageId`, odds snapshot, pool PDA
3. Confirm settle txs on Solscan (permissionless crank)
4. Click **Download bundle** — JSON proof export

**Do not expect:** mobile feed, agent personalities, memes.

---

## Track 2 — Agent Desk (~5 min)

**URL:** `https://copium.fun/desk`  
**Video:** matches BRAND-DOC §17B (agents only)

1. Confirm TxLINE SSE indicator is live (or simulator running)
2. Advance sim — watch **Spawner** create a Pulse question
3. Watch **Officer Copium** / **The Quant** rows — tx hash on each trade
4. Click **Copy** on an agent row — sign with devnet wallet (Blink via dial.to)
5. Check PnL leaderboard after Pulse closes

**Blinks:** `actions.json` at site root maps `/agent/*` → copy-agent, `/fade/*` → fade-agent.  
Test with [blinks.xyz inspector](https://www.blinks.xyz/inspector) — paste `https://dial.to/?action={your-api-url}`.

**Do not expect:** proof page tour, mobile swipe UI.

---

## Track 3 — Match Feed (~5 min)

**URL:** mobile app (`pnpm --filter @copium/mobile start` with `EXPO_PUBLIC_WEB_URL`)  
**Room join web:** `/room/demo` or `/room/{slug}`  
**Video:** matches BRAND-DOC §17C (phone only)

1. Open app — World Cup match feed
2. Save devnet wallet pubkey in app setup
3. Join room via room id or **Join via Blink** on `/room/demo`
4. Swipe **YES** or **NO** on 90-second Pulse card (opens dial.to pulse-pick)
5. After Pulse settles — **Share receipt** from receipts section (`/r/{receiptId}`)

**Do not expect:** Merkle paths, crank UI, Desk terminal.

---

## Environment

```bash
COPIUM_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SITE_URL=https://copium.fun   # or http://127.0.0.1:3000 locally
TXLINE_API_BASE=https://txline-dev.txodds.com
```

## Verify scripts

```bash
pnpm verify:d19   # receipts OG + room join + share API
pnpm verify:d20   # 3 judge paths + actions.json + JUDGE.md
pnpm verify:d21   # CI + deploy config + feed context/flyby + ship checklist
```

## Repo map

| Path | What |
|------|------|
| `programs/copium-pulses` | On-chain YES/NO pools |
| `apps/agent-runtime` | Spawner + trading agents |
| `apps/mobile` | React Native Feed |
| `apps/web/app/desk` | Agent Desk |
| `apps/web/app/proof` | Proof surface |
| `apps/web/app/r` | Receipt landing + OG |
| `apps/web/app/room` | Room join + Blink |
| `packages/settlement` | Internal settle pipeline (not published) |

## Questions

Open a GitHub issue or DM @notarko on X.
