# Sports x SocialFi, Sports x Prediction Markets, Markets x Agents Research

Research date: 2026-06-28

Sources used:
- Colosseum Copilot API: project search, winner-only search, winner-vs-all compare, prediction market cluster, archive search.
- ETHGlobal Skills API: project searches for sports prediction, social prediction, agent markets, prediction finalists.
- Web search: SportFi, sports prediction market regulation, AI agents in markets, public Colosseum winner announcements.

Important ETHGlobal note: the attached ETHGlobal skill is `1.0.0`, but the API returned `x-skill-version: 1.1.0`. Update with `npx skills add ethglobal-skills/repo`.

## Executive Summary

The category is real, but the lazy version is dead on arrival.

Generic "sports betting onchain", generic "fan token community", and generic "AI trading bot" are already crowded. The projects that placed well, got honorable mentions, or looked more serious had one sharp wedge:

- A native distribution surface: X/Twitter, Blinks, WhatsApp, group chats, mobile, creator communities.
- A familiar game mechanic: fantasy drafting, PvP parlays, card packs, leaderboards, streaks.
- A new market structure: VAMM, LMSR, structured prediction products, private/opportunity markets.
- A trust primitive: verifiable agent performance, reputation, signed predictions, non-custodial execution.
- A real data advantage: live sports stats, social media feeds, wearable/biometric data, official fantasy feeds.

The strongest opportunity is not "a sportsbook on Solana". It is:

> Agent-scored social sports markets: friend/group sports prediction rooms where humans and AI agents build public track records, users can copy/fade predictors, and settlement happens through transparent escrow plus oracle/dispute flows.

This combines the strongest signals from all three requested domains without becoming just another sportsbook.

## Research Coverage

### Colosseum Copilot

Colosseum corpus:

| Metric | Value |
|---|---:|
| Total projects in compare set | 5,428 |
| Winner projects in compare set | 293 |
| Solana Prediction Markets cluster size | 149 projects |
| Solana Prediction Markets winners | 13 winners |

Prediction market cluster summary from Copilot:

> "Decentralized platforms built on the Solana blockchain that enable users to bet on future events, memecoin performance, and continuous probability distributions."

Top primitives in the Solana Prediction Markets cluster:

| Primitive | Count |
|---|---:|
| Prediction market | 127 |
| Oracle | 110 |
| Escrow | 31 |
| AMM | 24 |
| Staking | 22 |

Top tech stack:

| Tech | Count |
|---|---:|
| Solana | 149 |
| Rust | 66 |
| React | 64 |
| Anchor | 51 |
| TypeScript | 30 |

Top repeated problem tags:

| Problem | Count |
|---|---:|
| Information asymmetry | 8 |
| Centralized prediction markets | 8 |
| High transaction costs | 5 |
| Low engagement in prediction markets | 5 |
| Front-running | 4 |

### ETHGlobal

ETHGlobal searches covered:

- `sports prediction`
- `social prediction`
- `agent market`
- `prediction market` finalists

ETHGlobal signals were useful because they show the same themes appearing outside Solana:

- Sports prediction is moving toward fan tokens, creator communities, mobile UX, and AI-powered events.
- Prediction market finalists often add privacy, AI settlement, livestream data, Farcaster/social distribution, or real-world data.
- Agent marketplaces are extremely crowded, so "market x agents" needs a narrower performance/reputation/economic wedge.

## What Winners Did Differently

### 1. They avoided generic prediction markets

Colosseum has many generic prediction-market projects, but winners and honorable mentions usually had a distribution or mechanism edge.

Examples:

| Project | Source | Signal |
|---|---|---|
| `Melee Markets` | Colosseum Breakout | 2nd Place Consumer Apps. Viral prediction markets combining speculation with real-world outcomes. |
| `Degen Markets` | Colosseum Radar | Honorable Mention Gaming. Twitter-native prediction markets via Solana Blinks. |
| `Trump.fun` | Colosseum Breakout | Honorable Mention Gaming. AI agents turn Trump posts into bettable markets with auto-grading. |
| `GrokMarkets` | Colosseum Cypherpunk | AI-powered prediction markets inside Twitter threads with instant Solana payouts. |
| `Spulse` | Colosseum Radar | Blinks-based social media poll creation and staking. |
| `Oya` | Colosseum Cypherpunk | WhatsApp-integrated P2P prediction markets. |

Takeaway:

The market primitive alone is not enough. Winners wrap markets in a place users already argue: X, WhatsApp, Telegram, group chats, sports communities, fantasy leagues.

### 2. Fantasy mechanics are one of the clearest consumer wedges

| Project | Source | Signal |
|---|---|---|
| `Crypto Fantasy League (CFL)` | Colosseum Breakout | 1st Place Gaming, Accelerator C3. Fantasy sports-style PvP game for drafting token portfolios. |
| `Glympse.fun` | Colosseum Breakout | 4th Place Consumer Apps. Fantasy sports for social media engagement and creator tokens. |
| `Market Fantasy League` | Colosseum Cypherpunk | Fantasy-style trading competitions for crypto/RWAs. |
| `TokenDraft` | Colosseum Cypherpunk | Daily fantasy-style snake drafts for crypto tokens. |
| `Ralli Sports` | Colosseum Cypherpunk | Honorable Mention Consumer Apps. Fantasy sports with PvP parlays and NFT card packs. |
| `Stakezone` | Colosseum Breakout | Fantasy football prediction markets on Solana. |

Takeaway:

Fantasy is strong because users already understand leagues, drafts, streaks, leaderboards, weekly matchups, and side pots. Crypto can handle escrow, settlement, portable reputation, and programmable payouts.

### 3. Agent projects need measurable performance, not vibes

| Project | Source | Signal |
|---|---|---|
| `Moira` | Colosseum Cypherpunk | Agentic prediction market: agents create, research, resolve, and trade markets. |
| `Forge AI` | Colosseum Breakout | Honorable Mention AI. Competitive arena for testing and ranking AI agents. |
| `Homo Memetus` | Colosseum Breakout | Tokenized AI trading agents competing for liquidity based on onchain performance. |
| `aignt.fun` | Colosseum Breakout | Crowdfunded ML-driven trading agents across Solana DEXs. |
| `NeuralTrader` | Colosseum Breakout | Multi-agent AI trading ecosystem and social trading simulation. |
| `ZoneIn` | Colosseum Cypherpunk | AI trading OS for portfolio optimization and autonomous agents. |
| `Tradekit.fun` | Colosseum Breakout | Natural-language creation, testing, and deployment of AI trading agents. |
| `PawPad by ZkAGI` | Colosseum Breakout | Self-custodial autonomous trading platform for mobile users. |

Takeaway:

"AI agent" is not a product. The defensible product is a market for verifiable agent performance: track record, drawdown, calibration, strategy class, custody limits, and copy/fade flows.

### 4. Winners over-index on infra, data, and trading users

The winner-vs-all Copilot compare showed winners are more concentrated around:

- Solana data and monitoring infrastructure.
- Solana yield and DeFi optimization.
- DEX and trading infrastructure.
- React Native/mobile.
- DeFi traders, DeFi users, DAO operators, and yield farmers.

This matters because sports/social apps often die from weak mechanics. The best path is to borrow winner-like traits:

- Make the social app data-rich.
- Make the market engine useful to traders.
- Make the mobile/group flow native.
- Make settlement and reputation transparent.

## Colosseum Project Landscape

### Sports x SocialFi / Fan Engagement

| Project | Hackathon | Prize | One-liner / Relevance |
|---|---|---|---|
| `AlphaFC` | Radar | 1st Place DAOs & Network States | Fan-operated sports teams with tokenized club governance and fractional ownership. |
| `Glympse.fun` | Breakout | 4th Place Consumer Apps | Fantasy sports for social media engagement where users trade creator tokens and draft teams. |
| `Ralli Sports` | Cypherpunk | Honorable Mention Consumer Apps | Fantasy sports with PvP parlays and NFT-based card pack games. |
| `Fantasy Baller League` | Breakout | None found | Fantasy sports for Baller League football. |
| `Mojo Markets` | Breakout | None found | Athlete token marketplace based on real-world performance. |
| `TokenPlay` | Radar | None found | Athlete tokenization and fan engagement through NFTs and profit sharing. |
| `WeAreFootball` | Radar | None found | Football club governance and exclusive rewards. |
| `ATTIVO` | Breakout | None found | Sports social platform rewarding physical activity and onchain athletic identity. |
| `Neekofun` | Breakout | None found | Social sports betting with Solana Blinks copy-bet flow. |
| `Crypto Odyssey` | Renaissance | None found | Fantasy sports platform for player trading and prizes based on real performance. |

Observations:

- Fan ownership/governance appears, but the strongest example is `AlphaFC`, which was not just a fan chat app. It had real-world club governance framing.
- Fantasy mechanics recur across sports, social media, and tokens.
- Athlete tokenization appears several times, but it is riskier because it can drift toward securities/revenue-sharing concerns.
- Sports-social projects need a clear activity loop: draft, predict, compete, settle, flex reputation, repeat.

### Sports x Prediction Markets

| Project | Hackathon | Prize | One-liner / Relevance |
|---|---|---|---|
| `Splash Markets` | Radar | None found | Sports prediction markets with VAMM design to reduce LP impermanent loss. |
| `Stakezone` | Breakout | None found | Fantasy football prediction markets tied to weekly team performance. |
| `Stakepadi` | Cypherpunk | None found | Sports prediction marketplace where experts monetize predictions. |
| `90Plus` | Breakout | None found | Social sports betting for settling arguments through real-time in-play wagers. |
| `tap2bet` | Breakout | None found | Mobile-first prediction markets using LMSR. |
| `Squad Bet` | Cypherpunk | None found | CS2 teammate and match outcome markets. |
| `Footy Predict` | Radar | None found | AI-powered football outcome prediction. |
| `Live Sports` | Radar | None found | Real-time sports stats tracker. |
| `Ralli Sports` | Cypherpunk | Honorable Mention Consumer Apps | Fantasy sports with PvP parlays. |
| `Neekofun` | Breakout | None found | Copy-betting via Blinks. |

Observations:

- There are many sports prediction attempts, but few winners. That implies the space is crowded and hard.
- The better ideas add either market-structure innovation (`Splash`, `tap2bet`) or social context (`90Plus`, `Ralli`, `Neekofun`).
- A raw sportsbook clone is weak. A tool for fantasy leagues, group chats, esports teams, or creator-led sports rooms is stronger.

### Social Prediction / Viral Markets

| Project | Hackathon | Prize | One-liner / Relevance |
|---|---|---|---|
| `Melee Markets` | Breakout | 2nd Place Consumer Apps | Viral prediction markets with real-world event outcomes. |
| `Degen Markets` | Radar | Honorable Mention Gaming | Twitter-native prediction markets via Solana Blinks. |
| `Trump.fun` | Breakout | Honorable Mention Gaming | AI agents turn posts into gamified prediction markets. |
| `GrokMarkets` | Cypherpunk | None found | Prediction markets inside Twitter threads. |
| `Yapping` | Breakout | None found | Prediction markets for social media debates and viral discourse. |
| `Foresee.lol` | Cypherpunk | None found | Social prediction hub for sharing forecasts with friends. |
| `AsociaBet` | Breakout | None found | Social media-native PvP betting for viral content. |
| `Blink Hippo` | Radar | None found | Meme prediction markets through Solana Blinks. |
| `Spulse` | Radar | None found | Blinks-based social poll creation and staking. |
| `Oya` | Cypherpunk | None found | WhatsApp-integrated P2P prediction markets. |
| `emojimarket.xyz` | Cypherpunk | None found | Emoji markets for viral culture/social sentiment. |

Observations:

- Social distribution is a major recurring wedge.
- The same mechanics can be pointed at sports, creators, politics, memes, or culture.
- Sports Twitter is an obvious target because users already argue and make informal predictions constantly.

### Markets x Agents

| Project | Hackathon | Prize | One-liner / Relevance |
|---|---|---|---|
| `Moira` | Cypherpunk | None found | Agentic permissionless prediction markets with autonomous creation, resolution, and trading. |
| `Forge AI` | Breakout | Honorable Mention AI | Arena for testing and ranking AI agents. |
| `Homo Memetus` | Breakout | None found | Tokenized AI trading agents competing for liquidity via verifiable performance. |
| `aignt.fun` | Breakout | None found | Crowdfunded ML trading agents. |
| `NeuralTrader` | Breakout | None found | Multi-agent trading ecosystem. |
| `AI Betworks` | Breakout | None found | Prediction game around AI agent token discussions and PvP influence. |
| `#PredictAI` | Radar | None found | AI-powered prediction marketplace with automated AI settlement. |
| `PredictionSwap` | Breakout | None found | Prediction market aggregator and AI analysis tool. |
| `Tradekit.fun` | Breakout | None found | Natural-language AI trading agent creation and deployment. |
| `PawPad by ZkAGI` | Breakout | None found | Self-custodial mobile autonomous trading. |
| `AI Economy Protocol` | Cypherpunk | None found | Agent marketplace for service discovery, negotiation, and payments. |

Observations:

- Agent marketplaces are crowded.
- Agent trading bots are crowded.
- The less crowded wedge is not "create an agent"; it is "verify, rank, constrain, and monetize agent performance in a specific market category."
- Sports prediction is a good first domain because outcomes are repeated, legible, and easy for users to understand.

## ETHGlobal Project Landscape

### Sports Prediction Projects

| Project | Event | One-liner / Relevance |
|---|---|---|
| [FanForge](https://ethglobal.com/showcase/fanforge) | ETHGlobal Buenos Aires | Sports prediction game using card collectibles. |
| [GAMBET](https://ethglobal.com/showcase/gambet) | ETHGlobal New York 2025 | Sports prediction platform with AI-powered betting events on Chiliz Chain. |
| [XPrediction](https://ethglobal.com/showcase/xprediction) | ETHGlobal Singapore | Sports bets from Twitter. |
| [FanPredix](https://ethglobal.com/showcase/fanpredix) | ETHOnline 2024 | Sports prediction markets using team-specific fan tokens on Chiliz. |
| [GameStake](https://ethglobal.com/showcase/gamestake) | ETHOnline 2024 | Sportsbook-style prediction and NFT envelope game. |
| [ZEUS](https://ethglobal.com/showcase/zeus) | MarketMake | Sports prediction market plus flash-loan credit delegation. |
| [UnderDog](https://ethglobal.com/showcase/underdog) | ETHGlobal Bangkok | Dynamic yes/no liquidity model for betting. |
| [Predit](https://ethglobal.com/showcase/predit) | ETHGlobal Buenos Aires | Creator-based onchain prediction markets. |

### Prediction Finalists

| Project | Event | Prize | One-liner / Relevance |
|---|---|---|---|
| [DIVE](https://ethglobal.com/showcase/dive) | ETHGlobal Cannes 2026 | Finalist | AI swarm for real-world truth verification and autonomous settlement. |
| [PulsePlay](https://ethglobal.com/showcase/pulseplay) | HackMoney 2026 | Finalist | Real-time micro-prediction markets with LMSR + P2P liquidity. |
| [JetLagged](https://ethglobal.com/showcase/jetlagged) | ETHGlobal Buenos Aires | Finalist | Flight delay/cancellation betting. |
| [WannaBet](https://ethglobal.com/showcase/wannabet) | ETHOnline 2025 | Finalist | Farcaster mini app for peer-to-peer betting. |
| [Dike](https://ethglobal.com/showcase/dike) | ETHGlobal New Delhi | Finalist | Prediction protocol focused on limited capital and many predictions. |
| [PolyBet](https://ethglobal.com/showcase/polybet) | ETHGlobal Cannes | Finalist | AI-powered privacy-enforcing prediction market router. |
| [Signals](https://ethglobal.com/showcase/signals) | ETHGlobal Taipei | Finalist | Incentivized BTC predictions visualized as a heatmap. |
| [PVPVAI](https://ethglobal.com/showcase/pvpvai) | Agentic Ethereum | Finalist | Agentic/prediction-related architecture. |
| [Viral.games](https://ethglobal.com/showcase/viral-games) | ETHOnline 2024 | Finalist | Prediction markets for X, YouTube, and Farcaster virality. |

### Agent Market Projects

| Project | Event | One-liner / Relevance |
|---|---|---|
| [A2A](https://ethglobal.com/showcase/a2a) | ETHGlobal Cannes 2026 | Verified AI agent marketplace with ENS and x402 payments. |
| [Koi](https://ethglobal.com/showcase/koi) | ETHGlobal Cannes 2026 | AI agents compete as ALMs on Uniswap; capital flows to top performers. |
| [Alpha Dawg](https://ethglobal.com/showcase/alpha-dawg) | ETHGlobal Cannes 2026 | Autonomous AI swarm buys intel, debates trades, and proves steps onchain. |
| [ClankRoad](https://ethglobal.com/showcase/clankroad) | ETHGlobal Cannes 2026 | Verifiable AI agent marketplace where agents prove work before payment. |
| [GhostFi](https://ethglobal.com/showcase/ghostfi) | ETHGlobal Cannes 2026 | DeFAI agent marketplace with forkable yield agents. |
| [Rogue Capital](https://ethglobal.com/showcase/rogue-capital) | HackMoney 2026 | AI agent marketplace with instant micropayments. |
| [Envoy](https://ethglobal.com/showcase/envoy) | HackMoney 2026 | Agent marketplace with USDC staking accountability. |
| [KiloMarket](https://ethglobal.com/showcase/kilomarket) | HackMoney 2026 | Agent-to-agent marketplace using MCP, A2A, and payments. |
| [Hubble Trading Arena](https://ethglobal.com/showcase/hubble-trading-arena) | ETHGlobal Buenos Aires | Open-source LLM trading machine where financial agents coordinate. |
| [Hunch](https://ethglobal.com/showcase/hunch) | ETHGlobal New Delhi | AI marketplace for trading strategies and indicators. |
| [Agent Market](https://ethglobal.com/showcase/agent-market) | Agentic Ethereum | Register AI agents as NFTs and trade them by Dutch auction. |
| [Adapt.ai](https://ethglobal.com/showcase/adapt-ai) | Agentic Ethereum | AI agents execute DeFi strategies with multisig security. |

ETHGlobal takeaway:

The EVM ecosystem is converging on agent marketplaces, x402/payments, staking/slashing, verifiable work, and AI settlement. That confirms agent markets are hot but crowded. A Solana project should not be another generic agent marketplace. It should own one high-frequency category, like sports/social prediction, and use Solana for cheap repeated actions.

## Market Gaps

### Gap 1: Sports markets lack trustable social reputation

There are sports prediction apps and expert marketplaces, but few give users a portable "this person/agent is actually calibrated" reputation.

Opportunity:

- Track prediction accuracy.
- Track average odds at entry.
- Track ROI, max drawdown, and calibration.
- Track performance by sport/league/market type.
- Let users copy, fade, or challenge predictors.

### Gap 2: Agent markets lack domain-specific proving grounds

Agent marketplaces are crowded, but most are horizontal. They list agents; they do not prove agents in a repeated, measurable environment.

Sports predictions create a good proving ground:

- Frequent outcomes.
- Public results.
- Easy-to-understand questions.
- Strong social discussion.
- Natural leaderboards.

### Gap 3: Sports social apps lack a crypto-native reason

Fan chats, fantasy leagues, and sports forums do not need crypto by default.

Crypto becomes necessary only when the product has:

- Shared escrow.
- Transparent settlement.
- Portable reputation.
- Composable market positions.
- Open liquidity.
- Permissionless market creation.

### Gap 4: Long-tail markets need resolution infrastructure

The best social markets are not always official league markets. They are claims like:

- "Will this rookie start next match?"
- "Will this creator's prediction hit?"
- "Will this team announce a transfer?"
- "Will this player hit 20 points?"
- "Will this clip go viral?"

These need oracle, agent, and dispute systems more than they need a shiny betting UI.

## Idea Bank

### Domain 1: Sports x SocialFi

#### 1. Fan League OS

A tool for creators, clubs, and fan communities to run private sports leagues with USDC escrow, prediction games, weekly leaderboards, and reputation.

Inspired by:

- `Ralli Sports`
- `AlphaFC`
- `Glympse.fun`
- `Crypto Fantasy League`
- `FanForge`

Why crypto:

- Escrowed prize pools.
- Transparent payouts.
- Portable fan reputation.
- Token-gated or NFT-gated league access.

MVP:

- Create league.
- Invite friends/community.
- Weekly prediction cards.
- USDC escrow.
- Leaderboard.
- Manual/admin resolution first, oracle later.

Risk:

- Can drift into gambling compliance issues. Start with private groups, free-to-play/reward pools, or jurisdiction-aware gating.

#### 2. Proof-of-Fandom Passport

A reputation layer for fans based on attendance, predictions, team-token activity, creator league participation, and social contribution.

Inspired by:

- `AlphaFC`
- `WeAreFootball`
- `TokenPlay`
- `ATTIVO`

Why crypto:

- Cross-community identity.
- Verifiable participation.
- Portable access/rewards.

MVP:

- Prediction accuracy badge.
- Team/community badges.
- Streaks.
- Shareable profile.
- Simple API for league hosts.

Risk:

- Badges alone are weak. Tie reputation to access, limits, tournaments, or prizes.

#### 3. Creator Sports Rooms

Sports creators launch paid or sponsored prediction rooms with audience leaderboards and transparent prize pools.

Inspired by:

- `Glympse.fun`
- `Stakepadi`
- `Predit`
- `XPrediction`

Why crypto:

- Creator-controlled monetization.
- Public prediction records.
- Escrowed rewards.
- Composable creator reputation.

MVP:

- Creator creates room.
- Fans answer daily predictions.
- Rewards distributed weekly.
- Creator earns fee/sponsor take.

Risk:

- Needs creator distribution. Without creators, it is just another app.

#### 4. Athlete Moment Markets

Fans collect/trade athlete or moment cards whose score changes with real-world performance or social milestones.

Inspired by:

- `Mojo Markets`
- `TokenPlay`
- `FanForge`

Why crypto:

- Ownership of dynamic collectibles.
- Secondary markets.
- Transparent update rules.

MVP:

- Pick one sport/league.
- Dynamic cards.
- Weekly scoring.
- Trading marketplace.

Risk:

- Revenue-sharing athlete tokens are legally risky. Keep early version as game collectibles, not athlete securities.

### Domain 2: Sports x Prediction Markets

#### 1. Social Sports Argument Settler

Group-chat native markets for sports arguments: "next goal before halftime?", "will this player score?", "will this team win?"

Inspired by:

- `90Plus`
- `Oya`
- `Degen Markets`
- `WannaBet`

Why crypto:

- P2P escrow.
- Transparent rules.
- Automatic payouts.
- Shared reputation.

MVP:

- Telegram/Discord bot.
- Create yes/no market.
- Friends join sides.
- Admin or oracle resolution.
- Public track record.

Risk:

- Needs careful compliance framing.

#### 2. Fantasy Hedge Markets

Prediction markets for fantasy sports players to hedge lineup and matchup risk.

Inspired by:

- `Stakezone`
- `Ralli Sports`
- `FanPredix`

Why crypto:

- Escrowed side markets around existing fantasy leagues.
- Payout transparency.
- Lower-friction global pools.

MVP:

- Import/manual fantasy roster.
- Create weekly hedge markets.
- Group league settlement.

Risk:

- Fantasy data integrations can be messy. Start manual or with one platform.

#### 3. Sports Expert Market

Analysts publish predictions, stake reputation, and earn when followers profit or predictions resolve correctly.

Inspired by:

- `Stakepadi`
- `Footy Predict`
- `Signals`

Why crypto:

- Public performance history.
- Onchain staking/slashing.
- Transparent follower payouts.

MVP:

- Expert profile.
- Prediction posts with odds/confidence.
- Resolution and scorecard.
- Paid follows later.

Risk:

- Paid picks are full of scams. The product must punish bad predictors visibly.

#### 4. Live Micro-Market Engine

Infrastructure for next-play sports markets: pitch, point, corner, over, free throw, possession, kill count.

Inspired by:

- `PulsePlay`
- `Splash Markets`
- `tap2bet`

Why crypto:

- Fast settlement.
- Transparent liquidity.
- Open market creation.

MVP:

- One sport.
- One market type.
- Simulated or delayed data first.
- LMSR or simple pool model.

Risk:

- Official data is expensive. Use esports or amateur streams first.

#### 5. Sports Data Oracle Layer

Oracle/data infrastructure for sports prediction apps.

Inspired by:

- `Live Sports`
- `DIVE`
- the repeated oracle tag in Copilot prediction projects.

Why crypto:

- Shared data layer.
- Verifiable settlement.
- Disputeable resolution.

MVP:

- Pull data from one API.
- Publish signed results.
- Resolution SDK for prediction apps.

Risk:

- Hard to monetize unless multiple apps need it. Could be built as internal infra first.

### Domain 3: Markets x Agents

#### 1. Agent-Scored Sports Markets

Humans and agents both make sports predictions. Every prediction gets a timestamp, odds, confidence, and eventual score.

Inspired by:

- `Moira`
- `Forge AI`
- `Homo Memetus`
- `Stakepadi`
- `Footy Predict`

Why crypto:

- Public track records.
- Agent-owned or user-owned strategy accounts.
- Copy/fade markets.
- Escrowed competitions.

MVP:

- Agents submit predictions offchain, signed by wallet.
- Onchain hash/record.
- Manual outcome resolution.
- Leaderboard by sport and market type.

Risk:

- Agent predictions are commodity unless the scoring/risk layer is excellent.

#### 2. Agent Oracle Council

Multiple agents independently resolve long-tail sports/social markets, with staking and human dispute fallback.

Inspired by:

- `DIVE`
- `Moira`
- `#PredictAI`
- `Trump.fun`

Why crypto:

- Stake-backed resolution.
- Transparent disputes.
- Permissionless market creation.

MVP:

- Three resolver agents.
- Source citation.
- Confidence score.
- Challenge window.
- Human admin fallback.

Risk:

- Resolution quality will make or break it.

#### 3. Copy/Fade Agent Marketplace

Users allocate to or fade agents based on verified track record across sports, crypto, macro, and social markets.

Inspired by:

- `Homo Memetus`
- `aignt.fun`
- `Koi`
- `Hubble Trading Arena`
- `Hunch`

Why crypto:

- Non-custodial allocations.
- Transparent agent performance.
- Programmable fee splits.

MVP:

- Paper-trading first.
- Onchain scorecard.
- Copy alerts.
- Capital allocation later.

Risk:

- Autonomous capital management increases regulatory/security risk.

#### 4. Social Market Creation Agent

An agent watches X/Telegram/Discord sports debates and proposes markets with draft rules, resolution source, and odds.

Inspired by:

- `Trump.fun`
- `GrokMarkets`
- `Degen Markets`
- `Yapping`

Why crypto:

- Market creation can be permissionless.
- Settlement is transparent.
- Market links are shareable.

MVP:

- X/Twitter watcher.
- Generate market draft.
- Human approves.
- Market link via Blink.

Risk:

- Fully automated market creation can create bad or ambiguous markets. Keep human approval at first.

## Best Builds Ranked

### 1. Agent-Scored Social Sports Markets

Best combined idea.

What it is:

Friend/group sports prediction rooms where humans and AI agents compete. Every prediction builds a public record. Users can copy/fade top predictors.

Why it wins:

- Combines sports x social, sports x prediction, and markets x agents.
- Uses repeated sports events for agent evaluation.
- Avoids being just another sportsbook.
- Can start as a game/reputation product before handling serious capital.

MVP scope:

- One sport, one market type.
- Group rooms.
- Human predictions.
- One or two AI agents.
- Public leaderboards.
- Manual/semiautomated settlement.

### 2. Fantasy Hedge Markets

What it is:

Prediction markets for fantasy league risks.

Why it wins:

- Fantasy users already understand the pain.
- Stronger wedge than broad sports betting.
- Can start with private friend leagues.

MVP scope:

- Weekly matchup markets.
- Player prop-like markets.
- League escrow.
- Results from one fantasy data source or manual admin.

### 3. Agent Oracle Council

What it is:

Resolution layer for long-tail sports/social prediction markets.

Why it wins:

- Every prediction app needs resolution.
- Long-tail markets are underserved.
- Agents are actually useful here.

MVP scope:

- Market statement parser.
- Source recommendation.
- Multi-agent answer.
- Challenge window.
- Resolution API.

### 4. Creator Sports Rooms

What it is:

Creator-led sports prediction/fantasy rooms with transparent rewards.

Why it wins:

- Distribution is clearer than a standalone app.
- Sports creators already monetize picks, communities, and engagement.

MVP scope:

- Creator room.
- Daily cards.
- Leaderboard.
- Sponsor pool.

### 5. Live Micro-Market Engine

What it is:

Infrastructure for next-play sports markets.

Why it wins:

- Technically differentiated.
- Strong Solana fit.

Why it is lower ranked:

- Data access and regulation are harder.

## Recommended Product Direction

Build:

> A social sports prediction platform where humans and AI agents compete in public, build verifiable track records, and can be copied/faded inside friend or creator-led leagues.

Positioning:

> "Fantasy sports for prediction skill, with AI agents in the league."

Initial wedge:

- Start with football/soccer, cricket, NBA, or esports.
- Start in private rooms or creator communities.
- Start with free-to-play or small escrow pools depending on jurisdiction.
- Make reputation the core asset before liquidity.

Core loop:

1. User joins a room.
2. Room has daily/weekly sports prediction cards.
3. Humans and AI agents submit predictions with confidence.
4. Results settle.
5. Leaderboard updates accuracy, ROI, calibration, and streaks.
6. Users copy/fade top performers.
7. Creators host tournaments and earn fees/sponsorships.

Crypto primitives:

- USDC escrow for paid rooms.
- Onchain hashes or records for predictions.
- Public reputation NFTs/SBTs only if they unlock real access.
- Oracle/dispute module for settlement.
- Agent wallets or signed agent identities.

Avoid:

- Launching as a sportsbook.
- Athlete revenue-sharing tokens.
- Generic agent marketplace.
- Generic fan token chat.
- Fully automated unresolved long-tail markets on day one.

## Differentiation Checklist

To beat the existing hackathon attempts, the product must have:

- A specific first community.
- A repeated event loop.
- A public performance scoreboard.
- Simple group creation.
- Clear settlement rules.
- A reason agents are better than static picks.
- Mobile/social-native UX.
- A compliance-aware launch mode.

## Concrete MVP

Build in 2 weeks:

- Web or mobile web app.
- Login with wallet and/or social.
- Create a sports room.
- Add 5 prediction cards manually.
- Users submit pick + confidence.
- One AI agent submits picks.
- Admin resolves outcomes.
- Leaderboard tracks:
  - accuracy
  - ROI if odds are used
  - confidence calibration
  - streaks
  - best category
- Shareable room link.

Do not build:

- Full AMM.
- Full oracle network.
- Token.
- Agent marketplace.
- Complex fantasy integrations.

After proof:

- Add escrow.
- Add creator monetization.
- Add multiple agents.
- Add oracle/dispute flow.
- Add copy/fade.
- Add public API.

## Final Recommendation

The best build is not one of the three categories in isolation.

It is the intersection:

> Agent-scored social sports prediction rooms.

This is supported by:

- Colosseum sports/social projects: `AlphaFC`, `Glympse.fun`, `Ralli Sports`, `Neekofun`, `Market Fantasy League`.
- Colosseum prediction projects: `Melee Markets`, `Degen Markets`, `Trump.fun`, `GrokMarkets`, `Splash Markets`, `Stakezone`, `90Plus`.
- Colosseum agent projects: `Moira`, `Forge AI`, `Homo Memetus`, `aignt.fun`, `Tradekit.fun`.
- ETHGlobal sports projects: `FanForge`, `GAMBET`, `FanPredix`, `XPrediction`.
- ETHGlobal finalists: `DIVE`, `PulsePlay`, `WannaBet`, `Viral.games`, `PolyBet`.
- ETHGlobal agent-market projects: `Koi`, `Alpha Dawg`, `ClankRoad`, `GhostFi`, `Hubble Trading Arena`, `Hunch`.

The winning version is opinionated:

- Sports first.
- Social rooms first.
- Reputation first.
- Agents as competitors/analysts first.
- Escrow and copy/fade second.
- Protocol/market engine later.
