# copium.fun — Full Product Agile Plan

**Tagline:** Every moment is a market.  
**Category:** Live **Pulse feed** + public **Agent Desk** + TxLINE **Proof** — one engine, three submission surfaces.

**Hackathon:** Register 24 Jun 2026 · Submit 19 Jul 2026 · Winners 29 Jul 2026  
**Team:** 1–3 humans · **Tracks:** all three (separate Superteam entries) · **One prize max** (hackathon terms §2.6)
e` + devnet `copium-pulses` + devnet USDC. **Fixture simulator** = primary demo/video path (TxLINE historical bundles — UI feels live). Mainnet tier 12 = post-hackathon optional.

**Companion docs:** `BRAND-DOC.md
**Scope policy:** One **Pulse engine** powers three judge-facing surfaces — **Feed** (T3), **Desk** (T2), **Proof** (T1). **No published SDK.** World Cup = Season 0.

**Environment (LOCKED):** **Devnet** for build, demo, video, submission. TxLINE devnet + devnet `txoracl` (three separate videos §17A–C), `txline-txodds-research.md`, `sports-socialfi-prediction-agents-research.md`

**Progress:** D1 ✅ · D2 ✅ · D3 ✅ · D4 ✅ · D5 ✅ · D6 ✅ · D7 ✅ · D8 ✅ · D9 ✅ · D10 ✅ · D11 ✅ · D12 ✅ · D13 ✅ · 4 Jul 2026 — Phase B crank on devnet (`pnpm verify:d12`)

---

## Table of contents

1. [Product definition](#1-product-definition)
2. [Verified external systems](#2-verified-external-systems)
3. [Architecture & monorepo](#3-architecture--monorepo)
4. [Database schema](#4-database-schema)
5. [Pulse engine (`@copium/pulse-engine`)](#5-pulse-engine-copiumpulse-engine)
6. [Pulse types & settlement](#6-pulse-types--settlement)
7. [TxLINE integration](#7-txline-integration)
8. [On-chain: `copium-pulses`](#8-on-chain-copium-pulses)
9. [Settlement pipeline (internal)](#9-settlement-pipeline-internal)
10. [Agent runtime](#10-agent-runtime)
11. [Room & duel scoring](#11-room--duel-scoring)
12. [Blinks & distribution](#12-blinks--distribution)
13. [Surfaces, routes & components](#13-surfaces-routes--components)
14. [Epics & backlog](#14-epics--backlog)
15. [21-day sprint calendar](#15-21-day-sprint-calendar)
16. [Testing & QA](#16-testing--qa)
17. [Deployment](#17-deployment)
18. [Hackathon submission pack](#18-hackathon-submission-pack)
19. [Post-hackathon roadmap](#19-post-hackathon-roadmap)
20. [Risk register](#20-risk-register)
21. [References](#21-references)

---

## 1. Product definition

### 1.1 One sentence

**copium.fun** turns every TxLINE World Cup event into a **90-second Pulse** (YES/NO pool on Solana): fans swipe on the **Feed**, **AI agents** trade on the **Desk**, and **`txoracle`** settles every Pulse with a public **Proof** bundle.

### 1.2 The atom: Pulse

| Field | Value |
|-------|-------|
| Trigger | TxLINE score/odds event (goal, card, HT, line jump) |
| Window | 90 seconds |
| Market | Binary YES/NO escrow |
| UI | Crowd % vs Line % (copium gap) |
| Settle | Condition-specific `validate_stat` or window expiry rules |
| Output | Receipt + proof link |

### 1.3 Three surfaces (same `pulse_id`)

| Surface | URL | Track | Density |
|---------|-----|-------|---------|
| **Feed** | `copium.fun` (RN) + `/m/*` web fallback | T3 Consumer | Soft consumer |
| **Desk** | `copium.fun/desk` | T2 Agents | Trading terminal |
| **Proof** | `copium.fun/proof/[pulseId]` | T1 Settlement | Audit minimal |

### 1.4 Core pipeline

```
TxLINE SSE (odds + scores)
  → EVENT DETECT (ingest: goal, phase change, odds delta)
      → PULSE SPAWN (Spawner LLM → question + market_type + closes_at)
          → POOL OPEN (create_pulse on copium-pulses)
              → CROWD FILL (users swipe YES/NO on Feed)
              → AGENT DESK (agents quote + execute positions)
                  → POOL CLOSE (lock at closes_at)
                      → SETTLE (validate_stat → post_settlement → settle_pulse)
                          → PROOF BUNDLE (/proof/[pulseId])
                          → RECEIPT (Feed) + PnL (Desk) + DUEL points (Room)
```

### 1.5 Three submissions (hackathon)

| # | Superteam title | Hero URL | Video |
|---|-----------------|----------|-------|
| 1 | copium.fun — Pulse Settlement | `/proof/...` | BRAND-DOC §17A |
| 2 | copium.fun — Agent Desk | `/desk` | BRAND-DOC §17B |
| 3 | copium.fun — Match Feed | mobile Feed | BRAND-DOC §17C |

Same repo. Different README emphasis per submission folder optional (`submissions/t1-settlement/README.md` etc.).

### 1.6 Remove TxLINE test

| Removed | Breaks |
|---------|--------|
| StablePrice odds | No Line % |
| Merkle proofs | Fakeable proof page |
| SSE streams | No Pulses, no agents |
| txoracle verify | No Track 1 crank |
| Feed + Rooms | No Track 3 |

### 1.7 Team roles (1–3 people)

| Role | Owns | Epics |
|------|------|-------|
| **Lead / Mobile + Web** | Feed RN, Feed web, receipts, Rooms | A, F, H, J |
| **Chain / Data** | ingest, settlement, copium-pulses, Proof UI | B, C, D, E |
| **Agents** | agent-runtime, Desk, Blinks | G, I |

### 1.8 Hackathon cuts (explicit)

**Ship P0:** `pulse_next_goal`, `pulse_over_under_ht`, Spawner + Officer + Quant, Feed swipe, Desk tape, Proof page, Room H2H, fixture simulator.

**Defer:** MagicBlock mainnet, extra agents (Sniper/Narrator polish), web Feed parity, mainnet, x-poster automation, multi-match seasons.

---

## 2. Verified external systems

### 2.1 TxLINE devnet (DEFAULT)

| Constant | Value |
|----------|-------|
| API base | `https://txline-dev.txodds.com` |
| OpenAPI | `https://txline-dev.txodds.com/docs/docs.yaml` |
| Program `txoracle` | `6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J` |
| TxL mint | `4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG` |
| USDT mint | `ELWTKspHKCnCfCiCiqYw1EDH77k8VCP74dK9qytG2Ujh` |
| Free WC tier | Service level **1** (60s delay) |
| JWT TTL | 30 days |
| Batch interval | 5 min UTC |
| Examples | `https://github.com/txodds/tx-on-chain` |

### 2.2 TxLINE mainnet (optional upgrade)

| Constant | Value |
|----------|-------|
| API base | `https://txline.txodds.com` |
| Program `txoracle` | `9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA` |
| Free WC real-time tier | Service level **12** |

Set `COPIUM_NETWORK=mainnet` — not required for hackathon.

### 2.3 Soccer settlement encoding

**Game phases:** NS=1, H1=2, HT=3, H2=4, **F=5**, ET variants 6–13  
**Stat keys:** 1 = P1 goals, 2 = P2 goals · period key = `(period × 1000) + base`  
**Instruction:** `txoracle.validate_stat(...)` · compute budget **1_400_000** for `.view()`

### 2.4 Odds SSE fields

`FixtureId`, `MessageId`, `Ts`, `Bookmaker`, `SuperOddsType`, `InRunning`, `Pct[]`, `Prices[]`

### 2.5 Hackathon legal (must comply)

- Humans only — **no bot submissions** (agents are product features, built by team)
- Judges test **without paying**
- No FIFA branding · no TxLINE redistribution
- Multiple tracks OK · **separate project per track** · **one prize max**
- Free-to-play default · devnet stakes for demo pools

### 2.6 Blinks

- `actions.json` at domain root
- Register **https://dial.to/register**
- Test **https://www.blinks.xyz/inspector**
- Package `@solana/actions`

---

## 3. Architecture & monorepo

### 3.1 Stack

| Layer | Choice |
|-------|--------|
| Monorepo | pnpm + Turborepo 2.x |
| Feed (primary) | **React Native** (Expo) — Track 3 demo device |
| Web | Next.js 16 App Router — Desk + Proof + Blinks API |
| Ingest | `apps/txline-ingest` — SSE + event detector |
| Pulse orchestrator | `apps/pulse-orchestrator` — spawn, close, enqueue settle |
| Agents | `apps/agent-runtime` — LLM spawner + execution agents |
| Settlement | `apps/settlement-worker` — validate_stat + crank |
| DB | Supabase Postgres + Realtime |
| Queue | Redis + BullMQ |
| On-chain | Anchor 0.32 `programs/copium-pulses` |
| Internal libs | `@copium/pulse-engine`, `@copium/txline` (not published) |
| Live state (stretch) | MagicBlock ephemeral for Pulse window — else Redis + fast crank |
| Proofs | txoracle IDL + internal `settlement/` module |
| Receipts | `next/og` ImageResponse + RN share sheet |

### 3.2 Monorepo tree

```
copium.fun/
├── apps/
│   ├── mobile/                    # React Native Feed (Track 3 hero)
│   │   └── src/
│   │       ├── screens/FeedScreen.tsx
│   │       ├── components/PulseCard.tsx
│   │       ├── components/DuelBanner.tsx
│   │       └── components/ReceiptShare.tsx
│   ├── web/
│   │   ├── app/
│   │   │   ├── (feed)/page.tsx           # web fallback / marketing
│   │   │   ├── desk/page.tsx             # Track 2 hero
│   │   │   ├── desk/agent/[id]/page.tsx
│   │   │   ├── proof/[pulseId]/page.tsx  # Track 1 hero
│   │   │   ├── r/[receiptId]/page.tsx
│   │   │   ├── room/[slug]/page.tsx
│   │   │   ├── sim/[sessionId]/page.tsx  # fixture simulator admin
│   │   │   └── api/
│   │   │       ├── actions/
│   │   │       │   ├── pulse-pick/[pulseId]/route.ts
│   │   │       │   ├── copy-agent/[tradeId]/route.ts
│   │   │       │   ├── fade-agent/[tradeId]/route.ts
│   │   │       │   └── join-room/[roomId]/route.ts
│   │   │       ├── pulses/route.ts
│   │   │       ├── proof/[pulseId]/route.ts
│   │   │       └── health/route.ts
│   │   └── components/
│   │       ├── desk-tape.tsx
│   │       ├── agent-reasoning.tsx
│   │       ├── proof-sheet.tsx
│   │       ├── crank-status.tsx
│   │       ├── bundle-download.tsx
│   │       └── pulse-countdown.tsx
│   ├── txline-ingest/
│   ├── pulse-orchestrator/
│   ├── agent-runtime/
│   │   └── src/
│   │       ├── spawner/            # LLM question gen
│   │       ├── agents/             # officer, quant, sniper, narrator
│   │       ├── executor.ts
│   │       ├── signer.ts
│   │       └── copy-router.ts
│   └── settlement-worker/
├── packages/
│   ├── pulse-engine/             # gap math, labels, duel points, pool math
│   ├── txline/                   # HTTP + SSE client
│   ├── settlement/               # lock, validate, hash, crank (INTERNAL)
│   └── db/
├── programs/
│   └── copium-pulses/
│       └── src/{lib,state,instructions}/
├── submissions/
│   ├── t1-settlement/README.md
│   ├── t2-agent-desk/README.md
│   └── t3-match-feed/README.md
├── .vendor/tx-on-chain/
├── BRAND-DOC.md
├── AGILE-PLAN.md
└── JUDGE.md
```

### 3.3 Day 1 scaffold

```bash
mkdir copium.fun && cd copium.fun
pnpm init && pnpm add -D turbo typescript
pnpm create solana-dapp@latest apps/web -t gh:solana-foundation/templates/kit/nextjs
npx create-expo-app apps/mobile --template blank-typescript
git clone https://github.com/txodds/tx-on-chain.git .vendor/tx-on-chain
anchor init copium-pulses --no-git programs/copium-pulses
```

**D1 status:**

- [x] pnpm + turbo root monorepo
- [x] `apps/web` — `@copium/web` (Kit / `@solana/react-hooks`)
- [x] `apps/mobile` — `@copium/mobile` + `FeedScreen` shell
- [x] `packages/config` — TxLINE devnet constants (doc-sourced)
- [x] `.env.example`
- [x] `submissions/t{1,2,3}-*/README.md`
- [x] `.vendor/tx-on-chain` cloned locally (gitignored; clone per scaffold cmd)
- [x] `pnpm build` green
- [x] `programs/copium-pulses` (`anchor init` — devnet scaffold, `pnpm anchor:build`)

### 3.4 Key dependencies

`@solana/kit`, `@solana/actions`, `@coral-xyz/anchor`, `@supabase/supabase-js`, `zod`, `bullmq`, `ioredis`, `tweetnacl`, `ai` (Vercel AI SDK — Spawner + Narrator), `expo-haptics`, `expo-notifications`

---

## 4. Database schema

### 4.1 ERD

```
users ─┬─ room_members ─ rooms ─ pulses ─ positions
       ├─ agents ─ agent_trades
       ├─ copy_subscriptions
       └─ duel_scores (per room × fixture)

fixtures ─ odds_snapshots / score_snapshots / events
proof_bundles ─ settlements
simulator_sessions
receipts
```

### 4.2 Core tables (`packages/db/migrations/001_pulses.sql`)

```sql
CREATE TABLE fixtures (
  txline_fixture_id BIGINT PRIMARY KEY,
  home_name TEXT,
  away_name TEXT,
  kickoff_at TIMESTAMPTZ,
  phase TEXT DEFAULT 'NS',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pulses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id BIGINT REFERENCES fixtures(txline_fixture_id),
  pulse_type TEXT NOT NULL,           -- 'next_goal' | 'over_under_ht' | ...
  question TEXT NOT NULL,
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  line_pct NUMERIC(5,2),              -- TxLINE implied at open
  crowd_yes_pct NUMERIC(5,2) DEFAULT 50,
  status TEXT DEFAULT 'open',         -- open | locked | settled | cancelled
  onchain_pool_pubkey TEXT,
  odds_message_id TEXT,
  odds_proof JSONB,
  settlement_root BYTEA,
  winning_side TEXT,                  -- 'yes' | 'no'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_id UUID REFERENCES pulses(id),
  user_id UUID,
  agent_id UUID,
  side TEXT CHECK (side IN ('yes','no')),
  stake BIGINT NOT NULL,
  onchain_position_pubkey TEXT,
  result TEXT,                        -- win | loss | push
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,          -- 'officer-copium' | 'quant' | 'spawner'
  display_name TEXT NOT NULL,
  wallet_pubkey TEXT NOT NULL,
  onchain_agent_pubkey TEXT,
  config JSONB DEFAULT '{}'
);

CREATE TABLE agent_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  pulse_id UUID REFERENCES pulses(id),
  side TEXT,
  stake BIGINT,
  reasoning TEXT,
  signature TEXT,
  execute_tx TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  fixture_id BIGINT REFERENCES fixtures(txline_fixture_id),
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE room_members (
  room_id UUID REFERENCES rooms(id),
  user_id UUID,
  duel_points INT DEFAULT 0,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  pulse_id UUID REFERENCES pulses(id),
  label TEXT,                         -- CERTIFIED | PROPHETIC | BASED
  og_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE proof_bundles (
  pulse_id UUID PRIMARY KEY REFERENCES pulses(id),
  truth_json JSONB,
  settlement_json JSONB,
  verify_tx TEXT,
  bundle_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE simulator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id BIGINT,
  bundle JSONB,                       -- recorded SSE events
  cursor INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE copy_subscriptions (
  user_id UUID,
  agent_id UUID REFERENCES agents(id),
  max_stake BIGINT,
  mode TEXT CHECK (mode IN ('copy','fade')),
  PRIMARY KEY (user_id, agent_id)
);
```

---

## 5. Pulse engine (`@copium/pulse-engine`)

Internal package. **Not published.**

Exports: `copium-gap`, `labels`, `duel-points`, `pool-math`, `pulse-catalog`, `calibration`.

### 5.1 Copium gap

```typescript
function copiumGap(crowdYesPct: number, linePct: number): number {
  return Math.abs(crowdYesPct - linePct);
}
```

### 5.2 Labels (receipts)

| Condition | Label |
|-----------|-------|
| picked YES, crowd >> line, lost | CERTIFIED |
| picked YES early, won | PROPHETIC |
| picked with line, won | BASED |
| default win | WIN |
| default loss | LOSS |

### 5.3 Duel points (match-scoped Room)

```typescript
function duelPoints(result: 'win' | 'loss', label: string): number {
  if (result === 'win' && label === 'PROPHETIC') return 3;
  if (result === 'win') return 2;
  if (result === 'loss' && label === 'CERTIFIED') return 1; // shame point to opponent
  return 0;
}
```

### 5.4 Pool math

Binary YES/NO parimutuel. `FEE_BPS = 200` optional room fee — tune in tests.

### 5.5 Pulse catalog (P0)

| pulse_type | Question template | Settle |
|------------|-------------------|--------|
| `next_goal` | "Another goal before {minute}?" | score keys @ window end |
| `over_under_ht` | "Over 0.5 goals in H1?" | H1 keys 1001, 1002 @ HT |

**Post-hackathon:** `match_winner`, `next_card`, `line_move_continues`

---

## 6. Pulse types & settlement

### 6.1 Open (position)

```
1. Pulse spawned with question + closes_at
2. User/agent picks YES or NO + stake
3. Snapshot odds: GET validation for messageId
4. Build open_position ix (copium-pulses)
5. UPDATE positions, crowd_yes_pct aggregate
```

### 6.2 Settle (three phases)

**Phase A — Truth** (settlement-worker):
```
condition met OR closes_at passed
  → settlement/validateScore()
  → buildSettlementRoot(bundle)
  → INSERT proof_bundles
  → UPDATE positions.result
```

**Phase B — Markets** (permissionless crank):
```
post_settlement(pulse, settlement_root)
settle_pulse(pulse)
withdraw(position)
```

**Phase C — Downstream**:
```
duel_points → room_members
receipt job → receipts
agent PnL rollup
Realtime push → Feed + Desk
```

---

## 7. TxLINE integration

### 7.1 Service wallet setup (devnet)

```bash
solana-keygen new -o service-wallet.json
solana config set --url devnet
solana airdrop 2 $(solana address -k service-wallet.json)
pnpm txline:subscribe
```

### 7.2 `apps/txline-ingest` — **D4 ✅**

- [x] Fork odds + scores SSE (devnet, real `TXLINE_API_TOKEN`)
- [x] **Event detector:** goal (score delta), phase change, implied move >5pp (`packages/txline/src/detect.ts`)
- [x] Publish to Redis: `event:{fixtureId}`, `odds:{fixtureId}`, `scores:{fixtureId}`
- [x] Health `:9090/health` · verify: `pnpm verify:d4`
- **Note:** devnet scores stream may heartbeat-only until live fixtures; odds + `odds_move` events verified 1 Jul 2026

### 7.3 Fixture simulator

```typescript
// apps/pulse-orchestrator/src/simulator.ts
// Load simulator_sessions.bundle
// Advance cursor → emit synthetic SSE events on interval
// Feed shows push-style notifications
// Used for all three demo videos
```

Historical source: `GET /api/scores/historical/{fixtureId}` + odds batch endpoints.

### 7.4 Proof clients

- Odds: `GET /api/odds/validation`
- Scores: `GET /api/scores/stat-validation`
- Reference: `.vendor/tx-on-chain/examples/validation/`

---

## 8. On-chain: `copium-pulses`

Replaces `copium-markets`. Binary YES/NO only.

### 8.1 Accounts

```rust
pub struct PulsePool {
    pub authority: Pubkey,
    pub fixture_id: u64,
    pub pulse_type: u8,
    pub opens_at: i64,
    pub closes_at: i64,
    pub yes_total: u64,
    pub no_total: u64,
    pub status: u8,              // Open, Locked, Settled, Cancelled
    pub winning_side: u8,        // 0 yes, 1 no
    pub odds_lock_root: [u8; 32],
    pub settlement_root: [u8; 32],
    pub bump: u8,
}

pub struct Position {
    pub pool: Pubkey,
    pub owner: Pubkey,
    pub side: u8,                // 0 yes, 1 no
    pub stake: u64,
    pub odds_message_hash: [u8; 32],
    pub bump: u8,
}

pub struct AgentAccount {
    pub authority: Pubkey,
    pub agent_wallet: Pubkey,
    pub agent_slug_hash: [u8; 8],
    pub total_pnl: i64,
    pub trade_count: u32,
    pub bump: u8,
}
```

### 8.2 Instructions

| IX | Purpose |
|----|---------|
| `create_pulse` | Open pool for fixture + type |
| `open_position` | YES or NO + USDC |
| `lock_pulse` | After closes_at |
| `post_settlement` | Anyone — settlement_root |
| `settle_pulse` | Set winning side |
| `withdraw` | Pro-rata payout |
| `register_agent` | AgentAccount PDA |

**Do NOT** embed Merkle validation in program — worker passes roots.

---

## 9. Settlement pipeline (internal)

`packages/settlement/` — **not npm published**. Powers Proof UI only.

```typescript
export { lockOddsSnapshot } from './lock';
export { validateScore } from './validate';
export { buildSettlementRoot } from './hash';
export { buildSettleIxs } from './crank';
export type { PulseTruthBundle, PulseSettlementBundle };
```

Track 1 judges use `/proof/[pulseId]` + `submissions/t1-settlement/README.md` — not a separate package install.

---

## 10. Agent runtime

### 10.1 Pipeline

```
Redis events + odds
  → Spawner (LLM): PulseQuestion { text, pulse_type, closes_at }
  → pulse-orchestrator: INSERT pulse + create_pulse ix
  → Strategy agents evaluate gap / line move
  → signIntent(ed25519)
  → Executor: open_position (agent wallet)
  → INSERT agent_trades
  → CopyRouter for subscribers
  → Realtime → Desk tape + Feed agent card
```

### 10.2 Agents (P0)

| Slug | Name | Behavior |
|------|------|----------|
| `spawner` | The Spawner | LLM: event → question (no trading) |
| `officer-copium` | Officer Copium | Fade when gap > 20pp |
| `quant` | The Quant | Trade toward line on snapback |
| `sniper` | The Sniper | Last 15s momentum (stretch) |
| `narrator` | The Narrator | Receipt copy + Desk flavor text |

**LLM allowed for:** question text, reasoning blurbs, receipt titles.  
**LLM forbidden for:** settlement outcome, oracle replacement.

### 10.3 Desk UI data

- Live tape: `{ time, agent, side, stake, tx, reasoning }`
- PnL board per fixture + tournament
- Copy/fade buttons → Blink or in-app tx

### 10.4 Copy router

- `copy_subscriptions.max_stake`
- Fade = opposite side
- Blink builds unsigned tx for user wallet

---

## 11. Room & duel scoring

**Match-scoped only** — no weekly league engine.

### 11.1 Flow

1. Owner creates Room for fixture (`room/brazil-france`)
2. `join-room` Blink or in-app link
3. Each settled Pulse → `duel_points` applied H2H (optional pairing or room aggregate)
4. Feed shows duel banner: "You 4 — Them 2"

### 11.2 Jobs

| Job | Trigger | Action |
|-----|---------|--------|
| `score_duel` | pulse settled | Update room_members.duel_points |
| `mint_receipt` | pulse settled | OG image + receipts row |

---

## 12. Blinks & distribution

### 12.1 `actions.json`

```json
{
  "rules": [
    { "pathPattern": "/pulse/*", "apiPath": "/api/actions/pulse-pick/*" },
    { "pathPattern": "/agent/*", "apiPath": "/api/actions/copy-agent/*" },
    { "pathPattern": "/room/*", "apiPath": "/api/actions/join-room/*" }
  ]
}
```

### 12.2 Action routes (P0)

| Route | POST builds |
|-------|-------------|
| `pulse-pick/[pulseId]` | `open_position` yes/no |
| `copy-agent/[tradeId]` | mirror agent side, capped |
| `fade-agent/[tradeId]` | opposite side |
| `join-room/[roomId]` | room member signup |

### 12.3 dial.to checklist

- [ ] HTTPS production domain
- [ ] CORS on Action routes
- [ ] Inspector pass on pulse-pick + copy-agent

---

## 13. Surfaces, routes & components

### 13.1 Routes

| Route | Surface | Track video |
|-------|---------|-------------|
| mobile Feed | Feed | §17C |
| `/desk` | Desk | §17B |
| `/proof/[pulseId]` | Proof | §17A |
| `/sim/[sessionId]` | Simulator admin | T1 video setup |
| `/r/[receiptId]` | Receipt landing | T3 |
| `/room/[slug]` | Room join web | T3 mention |

### 13.2 Feed components (mobile)

| Component | Behavior |
|-----------|----------|
| `PulseCard` | 90s countdown, Crowd vs Line bar, YES/NO swipe |
| `LiveHeader` | Score, minute, copium gap ticker |
| `DuelBanner` | Room H2H score |
| `AgentFlyby` | Compact agent trade card (no Desk) |
| `ReceiptCard` | Share sheet trigger |

### 13.3 Desk components (web)

| Component | Behavior |
|-----------|----------|
| `desk-tape.tsx` | Scrolling trades |
| `agent-reasoning.tsx` | LLM thought panel |
| `pnl-board.tsx` | Agent leaderboard |
| `copy-button.tsx` | One-click copy/fade |

### 13.4 Proof components (web)

| Component | Behavior |
|-----------|----------|
| `proof-sheet.tsx` | Merkle path, slot, txs |
| `crank-status.tsx` | Settle steps checklist |
| `bundle-download.tsx` | JSON export |

---

## 14. Epics & backlog

### EPIC A — Foundation (D1–D2) — **D2 ✅ (CI deferred)**

- [x] Monorepo (pnpm + Turborepo)
- [x] Web scaffold (`@copium/web`)
- [x] Mobile shell (`@copium/mobile`, `FeedScreen`)
- [x] `@copium/config` + `.env.example`
- [x] Submission READMEs (`submissions/t1–t3/`)
- [x] Public GitHub monorepo
- [x] `.vendor/tx-on-chain` cloned locally
- [x] Supabase `001_pulses.sql` migration (`@copium/db` — 11 tables live)
- [ ] CI

### EPIC B — TxLINE + simulator (D3–D7) — **D7 ✅**

- [x] Guest auth (`POST /auth/guest/start`)
- [x] Devnet on-chain `subscribe` (tier 1) + `POST /api/token/activate`
- [x] `pnpm txline:subscribe` — fixtures snapshot HTTP 200 (17 fixtures, 30 Jun 2026)
- [x] SSE ingest (`apps/txline-ingest`) — odds + scores fork, Redis pub/sub, `:9090/health`
- [x] Event detector (`@copium/txline/detect`) — goal, phase change, odds move >5pp → `event:{fixtureId}`
- [x] Simulator session builder (D5) — `buildSimBundle` + `replayStep` → Redis goal inject (`pnpm verify:d5`)
- [x] Health dashboard (D7 sim UI) — `/sim` stack health + `/sim/[sessionId]` scrub + orchestrator `would_spawn_pulse` (`pnpm verify:d7`)

### EPIC C — pulse-engine + settlement internal (D8–D10) — **D8 ✅**

- [x] `@copium/pulse-engine` — gap, labels, duel points, pool math, pulse catalog, calibration
- [x] Subpath exports (`copium-gap`, `labels`, `duel-points`, `pool-math`, `pulse-catalog`, `calibration`)
- [x] `evaluateBundle` — real TxLINE historical sim bundle → goal/HT settlement
- [x] `pnpm verify:d6` — unit tests + historical integration
- [x] `@copium/settlement` — `fetchStatValidation`, `validateStatOnChain` (txoracle `.view()` / simulate)
- [x] `pnpm verify:d8` — historical goal + HT + docs fixture on devnet
- [x] `pnpm verify:d8` — historical goal + HT + docs fixture on devnet
- [x] `/api/settlement/validate-stat` + sim session UI
- [x] lock odds snapshot (D10) — `lockOddsSnapshot` + TxLINE `/api/odds/validation`

### EPIC D — `copium-pulses` (D9–D12) — **D12 ✅**

- [x] `create_pulse` — PulsePool PDA + stake vault
- [x] `open_position` — YES/NO SPL transfer + Position PDA
- [x] `lock_pulse`, `post_settlement`, `settle_pulse`, `withdraw`
- [x] `@copium/pulses-client` — crank + withdraw helpers
- [x] `pnpm verify:d9` — anchor test · `pnpm verify:d12` — devnet crank

### EPIC E — pulse-orchestrator (D11–D13) — **D11 ✅ · D12 ✅**

- [x] `apps/settlement-worker` — poll open pulses past `closes_at`
- [x] `validateScore` — TxLINE timeline + `validate_stat.view()`
- [x] `buildSettlementRoot` + `proof_bundles` insert
- [x] `pnpm verify:d11` — spawn → Phase A → proof row
- [x] Phase B — `runPhaseBPoll` lock → post_settlement → settle_pulse
- [x] `pnpm verify:d12` — devnet crank + `proof_bundles.verify_tx`

### EPIC F — Proof surface (D12–D14) — **D13 ✅**

- [x] `/api/proof/[pulseId]` — pulse + `proof_bundles` JSON
- [x] `/proof/[pulseId]/page.tsx` — audit UI (Track 1 hero)
- [x] `proof-sheet.tsx` · `crank-status.tsx` · `bundle-download.tsx`
- [x] `pnpm verify:d13` — settled pulse → bundle download
- [x] crank wiring on proof page (`verify_tx` from Phase B)
- [ ] **Track 1 video ready D14**

### EPIC G — Agent runtime + Desk (D13–D17)
Spawner LLM, Officer + Quant execute, Desk UI, copy Blinks — **Track 2 video ready D17**

### EPIC H — Mobile Feed + Rooms (D14–D18)
Pulse cards, swipe, duel banner, receipts, join-room — **Track 3 video ready D18**

### EPIC I — Receipts (D16–D18)
OG templates, `/r/[id]`, verify badge link

### EPIC J — Blinks (D17)
pulse-pick, copy-agent, join-room, dial.to

### EPIC K — Hackathon submit (D19–D21)

- [x] `JUDGE.md` outline (repo root)
- [ ] 3 judge paths wired in product
- [ ] **3 Loom videos** (§17A/B/C)
- [ ] 3× Superteam forms

### EPIC L — Post-hackathon
MagicBlock live, mainnet, extra pulse types, Expo push prod

---

## 15. 21-day sprint calendar

**Anchor:** 28 Jun 2026 → **Deadline:** 19 Jul 2026

### Week 1 — Data + program + simulator (D1–D7)

| Day | Focus | Exit |
|-----|-------|------|
| **D1 ✅** | Monorepo, web, mobile shell, docs sync | turbo build green ✅ |
| **D2 ✅** | Supabase `001_pulses.sql`, tx-on-chain | DB live ✅ |
| **D3 ✅** | TxLINE auth + devnet subscribe | snapshot 200 ✅ |
| **D4 ✅** | SSE ingest + event detector | Redis events ✅ (`pnpm txline:ingest` + `pnpm verify:d4`) |
| **D5 ✅** | Simulator session from historical fixture | inject goal ✅ (`pnpm verify:d5`, `/sim`) |
| **D6 ✅** | `pulse-engine` + tests | 30+ unit cases + `pnpm verify:d6` on TxLINE historical |
| **D7 ✅** | **M1:** event → log `would_spawn_pulse` | sim UI scrub + `/api/stack/health` (`pnpm verify:d7`) |
| **D8 ✅** | validate_stat spike | `.view()` true (`pnpm verify:d8`, `/sim` validate_stat) |

### Week 2 — Chain + Proof + orchestrator (D8–D14)

| Day | Focus | Exit |
|-----|-------|------|
| **D8 ✅** | validate_stat spike | `.view()` true (`pnpm verify:d8`) |
| **D9 ✅** | `copium-pulses` create + open | anchor test (`pnpm verify:d9`) |
| **D10 ✅** | pulse-orchestrator spawn E2E | pulse row + pool (`pnpm verify:d10`) |
| **D11 ✅** | settlement-worker Phase A | proof_bundles (`pnpm verify:d11`) |
| **D12 ✅** | Phase B crank + withdraw | settled devnet (`pnpm verify:d12`) |
| **D13 ✅** | `/proof/[pulseId]` UI + download | bundle JSON (`pnpm verify:d13`) |
| D14 | **M2:** Track 1 video draft OK | §17A recordable |

### Week 3 — Agents + Feed + ship (D15–D21)

| Day | Focus | Exit |
|-----|-------|------|
| D15 | Spawner LLM + first agent execute | tx on Desk |
| D16 | Officer + Quant + Desk tape | copy works |
| D17 | **M3:** Track 2 video draft OK | §17B recordable |
| D18 | Mobile PulseCard swipe + duel | §17C recordable |
| D19 | Receipts OG + Room join | share works |
| D20 | Blinks + JUDGE.md + polish | 3 judge paths |
| D21 | **M5:** 3 final videos + 3 submissions | submit |

**D22 (19 Jul):** buffer — fix blockers

---

## 16. Testing & QA

| ID | Test | Method |
|----|------|--------|
| T0 | txline ingest + Redis events | `pnpm redis:up` · `pnpm txline:ingest` · `pnpm verify:d4` |
| T0b | fixture simulator + goal inject | `pnpm verify:d5` · `/sim` |
| T0c | D1–D7 stack | `pnpm verify:d1-d7` (spawns ingest for D4 if token set) |
| T1 | pulse-engine unit | `pnpm --filter @copium/pulse-engine test` |
| T2 | settlement lock/validate | integration historical fixture |
| T3 | validate_stat | settlement package |
| T3b | Proof page + bundle API | `pnpm verify:d13` · `/proof/[pulseId]` |
| T4 | Pulse open E2E | simulator + Playwright |
| T5 | Crank settle E2E | `pnpm verify:d12` · worker Phase B |
| T6 | Spawner output schema | zod snapshot |
| T7 | Agent execute | recorded events |
| T8 | Copy Blink | blinks.xyz inspector |
| T9 | Duel points | unit |
| T10 | JUDGE walkthrough ×3 | one path per track |

---

## 17. Deployment

| Env | Solana | TxLINE |
|-----|--------|--------|
| local | devnet | devnet |
| staging | devnet | devnet |
| hackathon | devnet | devnet |

```bash
COPIUM_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
TXORACLE_PROGRAM_ID=6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J
TXLINE_API_BASE=https://txline-dev.txodds.com
REDIS_URL=redis://127.0.0.1:6379
TXLINE_INGEST_PORT=9090
# World Cup free tier locked in @copium/config (service level 1, devnet)
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
OPENAI_API_KEY=...          # Spawner + Narrator
```

**docker-compose:** redis, txline-ingest, pulse-orchestrator, agent-runtime, settlement-worker

---

## 18. Hackathon submission pack

### 18.1 Three separate submissions

| Track | Title | Demo entry | Video | README |
|-------|-------|------------|-------|--------|
| T1 | copium.fun — Pulse Settlement | `/proof/[id]` | §17A | `submissions/t1-settlement/` |
| T2 | copium.fun — Agent Desk | `/desk` | §17B | `submissions/t2-agent-desk/` |
| T3 | copium.fun — Match Feed | mobile app | §17C | `submissions/t3-match-feed/` |

### 18.2 Per-track deliverables

**Track 1**
- [ ] `copium-pulses` on devnet
- [x] Permissionless settle crank (`pnpm verify:d12`)
- [x] `/proof/[pulseId]` + JSON download (`pnpm verify:d13`)
- [ ] Simulator for repeatable demo
- [ ] **Loom §17A** (standalone)

**Track 2**
- [ ] `agent-runtime` with LLM Spawner + 2 executors
- [ ] `/desk` tape + PnL
- [ ] copy/fade Blinks
- [ ] **Loom §17B** (standalone)

**Track 3**
- [x] React Native Feed (shell — `FeedScreen`, D1)
- [ ] Pulse swipe + Room duel
- [ ] Receipts + share
- [ ] **Loom §17C** (phone only)

### 18.3 Shared deliverables

- [x] Public GitHub monorepo
- [ ] Live URL
- [x] `JUDGE.md` (outline on repo)
- [ ] Devnet badge all surfaces
- [x] No FIFA marks
- [ ] **Three videos — never combined**

### 18.4 JUDGE.md outline

```markdown
# Judge guide — copium.fun

## Track 1 — Pulse Settlement (~5 min)
1. /sim/{sessionId} — advance to goal (optional)
2. /proof/{pulseId} — locked odds, settle txs, download bundle
3. Solscan crank tx

## Track 2 — Agent Desk (~5 min)
1. /desk — SSE live indicator
2. Advance sim — watch Spawner + agent txs
3. Copy agent — sign tx
4. PnL board

## Track 3 — Match Feed (~5 min)
1. Open mobile app (TestFlight/APK link in README)
2. Receive pulse notification
3. Swipe YES/NO
4. Share receipt

Devnet. Phantom devnet. No payment.
```

### 18.5 Demo videos

**Three separate shoots.** Full scripts in **BRAND-DOC §17A, §17B, §17C**.

---

## 19. Post-hackathon roadmap

| Phase | When | What |
|-------|------|------|
| Season 1 | Aug–Sep 2026 | Club football pulses |
| MagicBlock live | Q3 2026 | sub-second in-match state |
| Agent marketplace | Q4 2026 | user-deploy strategies |
| Mainnet pools | TBD legal | real USDC |
| Non-sports pulses | 2027 | crypto, politics, creators |

---

## 20. Risk register

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | validate_stat fails WC | Spike D8; TxODDS support |
| R2 | JWT expiry | Refresh cron |
| R3 | 1-person overload | P0 calendar; cut Sniper/Narrator polish |
| R4 | LLM spawner garbage | Zod schema + fallback templates |
| R5 | Three videos scope | Record drafts D14/D17/D18 not D21 |
| R6 | Track shopping | Same pulse_id in all READMEs — one engine diagram |
| R7 | Gambling optics | Free rooms + devnet copy |
| R8 | RN demo friction | APK + TestFlight link in JUDGE.md by D20 |

---

## 21. References

### TxLINE
- https://txline-docs.txodds.com/llms.txt
- https://txline-docs.txodds.com/documentation/quickstart
- https://txline-docs.txodds.com/documentation/examples/onchain-validation
- https://txline-docs.txodds.com/documentation/programs/devnet
- https://github.com/txodds/tx-on-chain

### Solana
- https://solana.com/developers/guides/advanced/actions
- https://www.blinks.xyz/inspector
- https://dial.to/register

### Hackathon
- https://superteam.fun/earn/hackathon/world-cup/
- https://superteam.fun/earn/listing/prediction-markets-and-settlement/
- https://superteam.fun/earn/listing/trading-tools-and-agents/
- https://superteam.fun/earn/listing/consumer-and-fan-experiences/

### Colosseum prior art (unified pattern)
- `trump.fun` — AI spawner + prediction + gamified UI
- `trepa` — mobile consumer simplicity
- `degen-markets` — Blinks social native
- `crypto-fantasy-league-(cfl)` — React Native + live game state

---

*One engine. Three surfaces. Every moment is a market.*  
*Document version: 4.4 — D1–D4 complete · 1 Jul 2026*
