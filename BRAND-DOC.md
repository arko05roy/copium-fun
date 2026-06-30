# copium.fun — BRAND DOC

**The slide deck in a Google Doc.**  
Copy from here → hackathon forms, X posts, investor emails, TxODDS intros, grant apps.

**Tagline:** *Every moment is a market.*

**Category:** Live World Cup **Pulse feed** — 90-second markets on TxLINE events, public **agent desk**, on-chain **proof** on every pulse.

---

## 0. How to use this (30 seconds)

**One engine. Three submissions. Three videos.**

Same repo, same Pulse ID — three Superteam entries with **different form titles, demo URLs, and Loom videos**. Never mix tracks in one video.

| You're talking to… | Submission title | Demo URL | Video script |
|--------------------|------------------|----------|--------------|
| **Track 1** — Prediction Markets & Settlement | copium.fun — Pulse Settlement | `copium.fun/proof/...` | §17A |
| **Track 2** — Trading Tools & Agents | copium.fun — Agent Desk | `copium.fun/desk` | §17B |
| **Track 3** — Consumer & Fan | copium.fun — Match Feed | `copium.fun` (mobile) | §17C |
| **TxODDS** | §9 | Proof + live ingest | Settlement video |
| **Twitter** | §10 | Feed + receipts | Feed cuts only |
| **Investors** | §7 | All three links | Any |

**Demo note:** Devnet + fixture simulator (real TxLINE replay bundles). UI must **feel live** — push notification energy, countdown, not a docs walkthrough.

---

## 1. Say this out loud (pick one)

| Who | Line |
|-----|------|
| **Anyone** | copium.fun — every goal opens a 90-second market. |
| **Track 1** | Every Pulse locks TxLINE odds at open and settles with a permissionless crank. |
| **Track 2** | AI agents quote, trade, and compete on every Pulse — copy or fade in one tap. |
| **Track 3** | World Cup on your phone — swipe YES/NO before the moment dies. |
| **Crypto Twitter** | Crowd 71%. Line 38%. That's copium. |
| **Investor** | Live-event prediction infrastructure with a consumer feed and an agent layer. |
| **Solana** | Goal → market → agents → settle → receipt. On-chain. |

**Hackathon say:** "Pulse settlement" · "TxLINE-attested pools" · "public agent desk"  
**Consumer say:** "90-second game" · "receipt culture" · "copium gap"  
**Avoid:** SDK, inhale/exhale, weekly league, Proof Explorer as product name

---

## 2. Explain it in 4 sentences (any audience)

1. **World Cup moments move fast** — goals, cards, line jumps — and fan takes disappear with no proof.  
2. **copium.fun** turns every TxLINE event into a **Pulse**: a 90-second YES/NO market.  
3. **The Crowd** swipes; **The Line** (TxLINE) is the villain; **agents** trade the gap in public on the Desk.  
4. When the Pulse closes, **`txoracle` settles** the pool and everyone gets a **receipt** — winners, losers, and CERTIFIED copium.

**We are not a sportsbook.** We're a **live moment factory** — feed, agents, proof.

---

## 3. The product in one picture

```
TxLINE SSE (odds + scores + events)
    ↓
PULSE SPAWN — AI turns event → question, 90s window opens
    ↓
CROWD vs LINE — pool fills (YES/NO), gap = copium
    ↓
AGENT DESK — Spawner, Officer, Quant, Sniper trade on-chain
    ↓
SETTLE — txoracle.validate_stat → crank → proof bundle
    ↓
FEED — receipt card, friend duel score, next moment
```

**World Cup = Season 0.** Pulses work for any live event with a line.

---

## 4. Track 1 pitch — Prediction Markets & Settlement

**Form title:** *copium.fun — Pulse Settlement*

**Subtitle for tech box:** Permissionless TxLINE-settled flash pools — reference app, no separate SDK.

**Turn up:** Merkle-locked odds at Pulse open · permissionless crank · downloadable proof bundle  
**Turn down:** memes, agent roster, mobile feed (mention they exist, don't show)

### Paste this

Sports micro-markets die in group chat. **copium.fun** makes every World Cup moment a **settled pool** on Solana.

Each **Pulse** is a binary YES/NO escrow on Anchor. At open we lock a **TxLINE `messageId` + odds snapshot** to the pool PDA. At close, **`txoracle.validate_stat`** verifies the condition; anyone can **`post_settlement` + `settle_pulse`** — no admin key.

**Proof** lives at `copium.fun/proof/[pulseId]`: Merkle path, slot timestamps, settle tx, JSON bundle download.

**Built on TxLINE. Breaks without TxLINE.**

### 10-second demo line

> "Goal. Pulse opens. Odds locked to messageId. Whistle. validate_stat. Crank. Proof page — download the bundle."

### Bullets for judges

- `programs/copium-pulses` — `PulsePool`, `Position`, permissionless settle  
- Internal settlement pipeline (not a published SDK)  
- **`/proof/[pulseId]`** — full verification UI  
- Fixture simulator for repeatable demo  
- Free TxLINE tier · devnet USDC · no FIFA marks  

### Video

**§17A only.** Do not show Feed swipe UI or agent personalities.

---

## 5. Track 2 pitch — Trading Tools & Agents

**Form title:** *copium.fun — Agent Desk*

**Turn up:** LLM market spawner · autonomous execution · copy/fade · public PnL tape  
**Turn down:** receipt memes, friend duels, proof jargon

### Paste this

**copium.fun Agent Desk** is a public trading floor for World Cup Pulses.

**The Spawner** (LLM) reads TxLINE events and instantiates market questions. **Officer Copium**, **The Quant**, **The Sniper**, and **The Narrator** consume the same odds SSE, post signed intents, and **execute on devnet** — visible tx hash on every row.

Fans **copy or fade** any agent via in-app one-tap or Solana Blink (`copy-agent` / `fade-agent`) with stake caps. Match-level PnL leaderboard updates live.

Not alerts. **Trades.**

### 10-second demo line

> "Goal hits. Spawner opens a Pulse. Quant fades the crowd — tx on devnet. Copy Quant. Settle. PnL updates."

### Bullets for judges

- `apps/agent-runtime` — spawn → evaluate → sign → execute  
- On-chain `AgentAccount` + `agent_trades` log  
- **`/desk`** — tape, PnL, reasoning panel, copy buttons  
- LLM for question generation + trade narrative (not outcome oracle)  
- Copy/fade Blinks  

**Note:** Hackathon entry is humans-only; agents are product features built by the team.

### Video

**§17B only.** Screen record Desk + Solscan. No mobile feed, no proof page tour.

---

## 6. Track 3 pitch — Consumer & Fan Experiences

**Form title:** *copium.fun — Match Feed*

**Turn up:** 90-second swipe game · friend duels · receipts · push moments  
**Turn down:** Merkle, crank, agent infra (say "verified" badge only)

### Paste this

**copium.fun** is a **live match feed** for World Cup — TikTok-style cards, one thumb.

Every goal pushes a **Pulse card**: 90-second countdown, **Crowd % vs Line %**, swipe **YES** or **NO**. Join a **Room** with friends — head-to-head points for the match, not a weekly league.

Wrong at 4%? **CERTIFIED COPIUM ☠️** Wrong but early? **PROPHETIC ★★★** Aligned with the line? **BASED ✓** — one-tap share to X.

**Pick from X** via Blinks (`join-room`, `pulse-pick`). Football is Season 0.

### 10-second demo line

> "Push notification. Open feed. Swipe YES. Friend loses the duel. CERTIFIED receipt drops. Quote tweet."

### Bullets for judges

- **React Native** match feed (primary demo device)  
- Pulse cards: LIVE · OPEN · DUEL · AGENT · RECEIPT  
- Room H2H scoped to **one match**  
- Shareable receipt PNGs + `copium.fun/r/[id]`  
- "Verified by TxLINE" badge — no oracle vocabulary in UI  

### Video

**§17C only.** Phone capture. No terminal, no Desk, no proof download.

---

## 7. Investor / grant story (60 seconds)

**Problem:** Live sports engagement is either dumb polls or closed books. No proof, no agents, no receipts.

**Solution:** **copium.fun** — TxLINE-native **Pulses** (90s markets), a public **Agent Desk**, and a **consumer feed** that turns every moment into shareable proof.

**Why now:** World Cup 2026 · TxODDS free data · agent + prediction convergence · Solana Blinks

**Why us:** One engine, three surfaces — settlement credibility + agent theater + viral consumer loop.

**Forever:** Any live event with a line and a loud crowd.

**Money later:** Room fees · sponsored Pulses · premium agent stats · TxODDS co-marketing

---

## 8. What beats what

| | Polymarket | DraftKings | Group chat | **copium.fun** |
|---|:---:|:---:|:---:|:---:|
| Live in-match moments | ◐ | ◐ | ✗ | **✓** |
| Settle with on-chain proof | ✓ | ✗ | ✗ | **✓** (TxLINE) |
| Public agent trading | ✗ | ✗ | ✗ | **✓** |
| 90s consumer loop | ✗ | ✗ | ✗ | **✓** |
| Shareable shame receipt | ✗ | ✗ | ✗ | **✓** |
| Crowd vs sharp line | ✗ | partial | ✗ | **✓** |
| Pick from X | ◐ | ✗ | ✗ | **✓** |

**Slide one-liner:** *They settle seasons. We settle moments — with agents, proof, and receipts.*

---

## 9. TxODDS email (copy-paste)

**Subject:** copium.fun — live Pulse settlement + fan feed on TxLINE

You've sold sharp odds to bookmakers for 20 years.

We built what the hackathon asks for in one product:

1. **Pulse Settlement** — flash pools, Merkle-locked odds, permissionless crank on devnet.  
2. **Agent Desk** — autonomous agents on your live SSE feed.  
3. **Match Feed** — fan-facing 90-second game with proof links on every card.

Every receipt points back to why verified odds matter.

World Cup demo on devnet. Happy to walk through live.

---

## 10. X / CT post bank

### Launch
> copium.fun is live  
> every moment is a market  
> World Cup Season 0 · 90 seconds · proof attached

### Pulse open
> GOAL  
> Pulse open — 90s  
> Crowd 71% · Line 38%  
> that's copium  
> copium.fun

### Certified
> CERTIFIED COPIUM ☠️  
> swiped YES @ 4% crowd  
> final: 0-2  
> copium.fun/r/xxx

### Agent move
> Officer Copium faded the crowd  
> tx: copium.fun/desk  
> copy or cope

### Friend duel
> you: 3 pulses · @them: 1  
> Brazil vs France room  
> copium.fun/r/wc-br-fr

### Room Blink
> join the match room from the timeline  
> copium.fun — swipe before the moment dies

---

## 11. Receipt cards

### CERTIFIED COPIUM ☠️
```
@{you} swiped YES
Crowd: {71}% · Line: {38}%
Score: {0-2}
CERTIFIED.
copium.fun/r/xxx
[Verified by TxLINE →]
```

### PROPHETIC COPIUM ★★★
```
@{you} early YES @ {14}%
THEY CALLED IT COPE
THE RECEIPT CALLED IT PROPHECY
copium.fun/r/xxx
```

### BASED ✓
```
@{you} aligned with the line @ {72}%
BASED RECEIPT
copium is for the crowd
copium.fun/r/xxx
```

---

## 12. Brand cheat sheet

| Term | Means |
|------|-------|
| **Pulse** | 90-second YES/NO market on a TxLINE event |
| **Crowd** | Pool imbalance / fan side (UI label) |
| **The Line** | TxLINE implied probability — the villain |
| **Copium gap** | \|Crowd % − Line %\| — big gap = copium |
| **Room** | Match-scoped friend group + H2H points |
| **Desk** | Agent trading surface (`/desk`) |
| **Proof** | Settlement bundle (`/proof/[pulseId]`) |
| **Receipt** | Share card — meme + verify link |
| **Certified / Prophetic / Based** | Shame L · rare W · line-aligned |
| **Officer Copium** | Mascot agent — fades crowd divergence |
| **The Spawner** | LLM agent — creates Pulse questions |
| **The Quant** | Line-following / mean-revert agent |
| **TxLINE / TxODDS** | Sponsor — data + settlement oracle |

### Voice
Funny surface on Feed. Serious tape on Desk. Audit tone on Proof.

### Look
| Surface | Vibe |
|---------|------|
| **Feed** | Warm, vertical, big thumbs, countdown urgency |
| **Desk** | Terminal green/red, dense tape, workstation |
| **Proof** | Monospace, black, audit document |

Mascot: **Officer Copium** (cop + chart)

---

## 13. FAQ

**Is this gambling?**  
Free rooms default. Demo stakes on devnet test USDC. Receipt game with optional escrow.

**Is this Polymarket?**  
They trade event shares. We run **90-second Pulses** on live moments + agents + receipts.

**Why TxODDS?**  
Only sponsor with **live odds + Merkle proof + on-chain settle path**.

**Three submissions — same product?**  
Same Pulse engine, **three entry points** per hackathon rules. Three videos, three form heroes.

**SDK?**  
No published SDK. Settlement is in-app; TxODDS gets a working reference implementation.

---

## 14. Hackathon checklist

- [ ] Submit **3 separate Superteam projects** (§4 / §5 / §6 titles)  
- [ ] **3 separate Loom videos** (§17A / §17B / §17C) — never mix tracks  
- [ ] `JUDGE.md` with three judge paths  
- [ ] Devnet badge on all surfaces  
- [ ] Proof link on every Pulse and receipt  
- [ ] GitHub public — highlight `programs/copium-pulses`, `apps/agent-runtime`, mobile feed  
- [ ] No FIFA marks · humans-only submission  

---

## 15. README opener

```markdown
# copium.fun

**Every moment is a market.**

Live World Cup Pulse feed · public Agent Desk · TxLINE-settled proof.

> Goal → Pulse → agents → settle → receipt.

## Surfaces
- **Feed** — mobile match game (Track 3)
- **Desk** — agent tape + copy/fade (Track 2)
- **Proof** — settlement verification (Track 1)

Built on [TxODDS TxLINE](https://txodds.net/our-products/tx-line/) · Solana World Cup Hackathon 2026
```

---

## 16. BD playbook

1. **Track 1 call:** open `/proof/[pulseId]` — crank + download bundle. Stop.  
2. **Track 2 call:** open `/desk` — agent tx + copy. Stop.  
3. **Track 3 call:** phone Feed — swipe + receipt. Stop.  
4. **TxODDS:** settlement video + one-liner on feed scale.  
5. **Seed one Certified + one Prophetic** in Feed demo data.  
6. **Simulator > static replay** — UI must feel like a push notification.  
7. Never say mock. Say **"locked to TxLINE."**

---

## 17. Demo videos — THREE SEPARATE SHOOTS

### §17A — Track 1 video (~2:00) — Pulse Settlement

**Record:** desktop browser, `/proof` + fixture simulator admin. **No phone. No Desk. No memes.**

| Time | Beat |
|------|------|
| 0:00 | "copium.fun Pulse Settlement — devnet" |
| 0:15 | Simulator: inject goal event → Pulse opens (admin view) |
| 0:30 | Show pool PDA · locked `messageId` · odds snapshot hash |
| 0:50 | Positions fill (can be scripted wallets) |
| 1:05 | Event resolves → `validate_stat` success in logs |
| 1:20 | **Crank** `post_settlement` + `settle_pulse` — Solscan |
| 1:35 | Open `/proof/[pulseId]` — Merkle path, txs, **Download bundle** |
| 1:50 | "Permissionless. TxLINE-attested. copium.fun/proof" |

---

### §17B — Track 2 video (~2:00) — Agent Desk

**Record:** desktop `/desk` + Solscan split. **No Feed. No proof tour.**

| Time | Beat |
|------|------|
| 0:00 | "copium.fun Agent Desk — devnet" |
| 0:15 | TxLINE SSE connected indicator |
| 0:25 | Goal → **Spawner** creates Pulse question (reasoning panel visible) |
| 0:40 | **Quant** + **Officer** rows appear — signed intent → **tx hash** |
| 1:00 | Click **Copy Quant** — subscriber wallet signs — mirror tx |
| 1:15 | Tape scrolls — multiple agent fills |
| 1:30 | Pulse closes → PnL leaderboard updates |
| 1:45 | Copy/fade Blink in inspector (optional 10s) |
| 1:55 | "Agents trade every Pulse in public. copium.fun/desk" |

---

### §17C — Track 3 video (~2:00) — Match Feed

**Record:** **phone only** (React Native). **No desktop. No crank. No Merkle.**

| Time | Beat |
|------|------|
| 0:00 | Push notification: "GOAL — Pulse open" |
| 0:10 | Open app — vertical feed — match header |
| 0:20 | Pulse card — **90s countdown** — Crowd vs Line bar |
| 0:35 | Swipe **YES** — haptic — confirmed |
| 0:45 | Friend duel banner: "You're up 2-1" |
| 0:55 | Agent card flies by (spectator — no Desk UI) |
| 1:10 | Pulse closes — win/loss animation |
| 1:25 | **CERTIFIED** or **PROPHETIC** receipt — share sheet → X |
| 1:40 | Scroll to next LIVE card |
| 1:55 | "90 seconds. copium.fun" |

---

## Appendix A — Tech paragraph (forms)

**Track 1:** copium.fun implements **Pulse pools** on Anchor (`copium-pulses`): binary YES/NO escrows with TxLINE odds locked at open via Merkle-attested snapshots, settled through `txoracle.validate_stat` and permissionless crank. Proof bundles at `/proof/[pulseId]`.

**Track 2:** `apps/agent-runtime` runs LLM **Spawner** plus execution agents (Officer Copium, Quant, Sniper) on TxLINE SSE — sign, execute on devnet, public PnL at `/desk`. Copy/fade via Blinks.

**Track 3:** React Native **Match Feed** — Pulse cards, match-scoped Rooms, H2H duels, receipt sharing. Fixture simulator for demo.

---

## Appendix B — Feature dial (submissions)

| Feature | T1 Settlement | T2 Agents | T3 Fan |
|---------|:-------------:|:---------:|:------:|
| `copium-pulses` crank | ●●● | ●● | ● |
| `/proof/[pulseId]` | ●●● | ● | ● |
| Merkle odds lock | ●●● | ● | ○ |
| `/desk` agent tape | ○ | ●●● | ● |
| LLM Spawner | ○ | ●●● | ○ |
| Copy/fade Blinks | ○ | ●●● | ●● |
| Officer Copium execute | ○ | ●●● | ● |
| React Native Feed | ○ | ○ | ●●● |
| Pulse swipe UX | ○ | ○ | ●●● |
| Room H2H | ○ | ● | ●●● |
| Receipts | ● | ● | ●●● |
| join-room Blink | ○ | ● | ●●● |

●●● = lead · ●● = mention · ● = background · ○ = omit from copy/video

---

*copium.fun — every moment is a market.*  
*Pulse it. Trade it. Prove it. Receipt it.*
