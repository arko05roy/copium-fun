# Judge guide — copium.fun

**Devnet only.** Phantom → Devnet. No payment required. No FIFA marks.

Three separate products from one Pulse engine. Pick your track:

---

## Track 1 — Pulse Settlement (~5 min)

**URL:** `copium.fun/proof/{pulseId}`  
**Video:** matches BRAND-DOC §17A (settlement only)

1. Optional: `/sim/{sessionId}` — advance fixture to goal event
2. Open `/proof/{pulseId}` — locked TxLINE `messageId`, odds snapshot, pool PDA
3. Confirm settle txs on Solscan (permissionless crank)
4. Click **Download bundle** — JSON proof export

**Do not expect:** mobile feed, agent personalities, memes.

---

## Track 2 — Agent Desk (~5 min)

**URL:** `copium.fun/desk`  
**Video:** matches BRAND-DOC §17B (agents only)

1. Confirm TxLINE SSE indicator is live (or simulator running)
2. Advance sim — watch **Spawner** create a Pulse question
3. Watch **Officer Copium** / **The Quant** rows — tx hash on each trade
4. Click **Copy** on an agent row — sign with devnet wallet
5. Check PnL leaderboard after Pulse closes

**Do not expect:** proof page tour, mobile swipe UI.

---

## Track 3 — Match Feed (~5 min)

**URL:** mobile app (link in repo README / TestFlight / APK)  
**Video:** matches BRAND-DOC §17C (phone only)

1. Open app — World Cup match feed
2. Trigger or wait for Pulse push notification
3. Swipe **YES** or **NO** on 90-second Pulse card
4. View friend duel banner (join via `/room/{slug}` if solo)
5. Share receipt to X from share sheet

**Do not expect:** Merkle paths, crank UI, Desk terminal.

---

## Environment

```bash
COPIUM_NETWORK=devnet
TXLINE_API_BASE=https://txline-dev.txodds.com
```

## Repo map

| Path | What |
|------|------|
| `programs/copium-pulses` | On-chain YES/NO pools |
| `apps/agent-runtime` | Spawner + trading agents |
| `apps/mobile` | React Native Feed |
| `apps/web/app/desk` | Agent Desk |
| `apps/web/app/proof` | Proof surface |
| `packages/settlement` | Internal settle pipeline (not published) |

## Questions

Open a GitHub issue or DM @notarko on X.
