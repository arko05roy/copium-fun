# TxLINE / TxODDS Research

Date researched: 28 June 2026

## Executive summary

TxODDS is a sports data company moving part of its institutional odds, scores, and fixture infrastructure into crypto through TxLINE, a Solana-anchored data distribution layer. TxLINE is not a separate hackathon organizer so much as the product TxODDS wants builders to use: real-time sports data delivered off-chain, with cryptographic hashes/Merkle roots anchored on Solana so applications can prove when a score, fixture, or odds update existed and that it was not altered.

The major public developer incentive I found is the TxODDS World Cup Hackathon, run with Solana and hosted on Superteam Earn. It has a $50,000 stablecoin/USDT prize pool across three tracks: Prediction Markets and Settlement, Trading Tools and Agents, and Consumer and Fan Experiences. I did not find convincing public evidence of older TxODDS or TxLINE hackathon prize payouts, grant programs, or completed developer grants before this campaign. The available public evidence points to this 2026 World Cup hackathon as the main current developer-facing funding/prize initiative.

TxODDS appears to want builders to prove that high-quality sports data plus Solana verification can support real products: prediction markets, automated settlement, trading agents, fan apps, compliance/audit tools, and data-backed betting infrastructure. A strong submission should make TxLINE data the core input, use live World Cup data, and show the value of tamper-evident data rather than simply displaying a scoreboard.

## What TxODDS is

TxODDS is a sports data supplier focused on odds, scores, fixtures, and betting-market data. Its existing positioning is B2B/institutional: supplying operators and market participants with data feeds used for pricing, trading, backtesting, settlement, and betting workflows.

The crypto push is TxLINE. TxODDS describes TxLINE as a sports data API and distribution layer that delivers fixtures, odds, scores, and settlement data while anchoring every data point on Solana. The product is meant to remove normal enterprise-data friction: instead of sales calls, long contracts, annual commitments, and weeks of onboarding, builders can use wallet-based authentication, token/subscription access, and API keys.

Key public positioning:

- "Institutional data, no sales call required."
- "On-chain verified, not just claimed."
- "Every odds feed is cryptographically timestamped on Solana."
- "Your compliance team gets proof, not promises."
- "Foundation for trustless smart-contract settlement."

Sources:

- TxLINE product page: https://txodds.net/our-products/tx-line/
- TxODDS World Cup hackathon announcement: https://txodds.net/resources/txodds-launches-world-cup-hackathon-with-solana/
- AGB launch coverage: https://agbrief.com/news/world/17/06/2026/txodds-releases-txline-ahead-of-the-fifa-world-cup-2026/
- Global Gaming Insider coverage: https://globalgaminginsider.com/news/5364/txodds-partners-with-solana-for-world-cup-hackathon

## What TxLINE is building

TxLINE is a hybrid system:

- Off-chain TxODDS services deliver sports data through request-response APIs and low-latency streaming.
- On-chain Solana programs store commitments/Merkle roots for batches of that data.
- API users can request Merkle proofs to verify whether a fixture, score, or odds update belongs to a published batch.
- Wallet/subscription state is handled on-chain, while the data itself is consumed through authenticated APIs.

The main data categories are:

- Fixtures: match schedules, metadata, and fixture lifecycle updates.
- Odds: StablePrice odds snapshots and live updates.
- Scores: score updates and match events.
- Merkle proofs: cryptographic verification for data integrity and timestamping.

Docs describe TxLINE as providing "cryptographically verifiable sports data through a hybrid Solana on-chain and TxODDS off-chain system." API access uses JWT/API tokens secured by on-chain subscriptions.

Technical highlights:

- Odds and scores are accumulated into 5-minute batch intervals.
- Fixture snapshots are grouped separately, including hourly/daily batch structures depending on the endpoint.
- Merkle roots are published on Solana.
- Users can validate individual updates with Merkle proofs.
- There are real-time Server-Sent Events streams for odds and scores.
- There are endpoints for historical score and odds updates.
- The Solana program is called `txoracle`.
- The public GitHub repo is `txodds/tx-on-chain`: https://github.com/txodds/tx-on-chain

Mainnet references from docs:

- Program ID: `9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA`
- TxL Token Mint: `Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL`
- USDT Mint: `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`
- API endpoint: `https://txline.txodds.com/api/`

Program address docs: https://txline.txodds.com/documentation/programs/addresses

## What TxLINE is useful for

The clearest use case is not "sports data on a blockchain" as a generic phrase. The specific value is proof around timing and integrity.

Possible uses:

- Prediction market settlement: prove a World Cup score, fixture state, or match event and settle a market.
- Betting settlement: verify pre-match odds locks and final outcomes.
- Trading agents: consume odds streams, detect price discrepancies, and automate responses.
- Backtesting: prove the historical feed used for a strategy was not modified later.
- Compliance/audit: show regulators or users a tamper-evident trail of what data was available at what time.
- Dispute resolution: prove whether a score, stat, or market state was present in a committed data batch.
- Fan experiences: live apps, games, leaderboards, social prediction games, and fantasy-style products using verifiable match data.

The docs explicitly call out validation use cases including trading settlement, conditional smart-contract logic, dispute resolution, automated markets, and score-differential validation.

On-chain validation docs: https://txline-docs.txodds.com/documentation/examples/onchain-validation

## Access model and pricing

TxLINE uses subscriptions priced per 28-day period. The docs list a conversion rate of 1 USD = 1,000 TxL. All subscriptions include Scores and StablePrice Odds.

Important hackathon-friendly point: World Cup and International Friendlies tiers are free.

Mainnet pricing shown in docs:

| ID | Bundle | Delay | Price / 28 days |
|---:|---|---|---:|
| 1 | World Cup & International Friendlies | 60 seconds | Free |
| 12 | World Cup & International Friendlies | Real-time | Free |
| 2 | 10 Leagues | 60 seconds | 500,000 TxL / $500 |
| 3 | 25 Leagues | 60 seconds | 750,000 TxL / $750 |
| 4 | 50 Leagues | 60 seconds | 1,000,000 TxL / $1,000 |
| 5 | 100 Leagues | 60 seconds | 1,250,000 TxL / $1,250 |
| 6 | All Leagues | 60 seconds | 2,500,000 TxL / $2,500 |
| 7 | 10 Leagues | Real-time | 5,000,000 TxL / $5,000 |
| 8 | 25 Leagues | Real-time | 7,500,000 TxL / $7,500 |
| 9 | 50 Leagues | Real-time | 10,000,000 TxL / $10,000 |
| 10 | 100 Leagues | Real-time | 12,500,000 TxL / $12,500 |
| 11 | All Leagues | Real-time | 25,000,000 TxL / $25,000 |

Subscription tier docs: https://txline-docs.txodds.com/documentation/subscription-tiers

Quickstart docs: https://txline-docs.txodds.com/documentation/quickstart

## Hackathon / prize history

### Confirmed current prize initiative: TxODDS World Cup Hackathon 2026

TxODDS has announced a World Cup-themed hackathon with Solana, hosted on Superteam Earn, using TxLINE as the core product. The event is designed to introduce TxLINE to builders and demonstrate live sports data on Solana.

Public facts found:

- Total prize pool: $50,000.
- Prize currency: stablecoin / USDT, with terms saying prize payments may come through Superteam Earn.
- Host/platform: Superteam Earn.
- Partner: Solana.
- Registration opened: 24 June 2026.
- Submission deadline: 19 July 2026.
- Winner announcement: 29 July 2026.
- Team size: 1 to 3 people.
- Participants can enter multiple tracks.
- Existing/legacy projects are not allowed as-is; significant work must be done during the hackathon.
- A functional build or live testnet app using TxLINE data as a primary input is required to qualify.
- TxODDS is waiving data fees and token payment requirements for the event.
- Participants get access to live/high-fidelity match feeds across all 104 World Cup games.
- There is also mention of Superteam chapters running watch parties/local hackathons, plus a World Cup final watch party in London.

Main sources:

- Official TxODDS announcement: https://txodds.net/resources/txodds-launches-world-cup-hackathon-with-solana/
- Superteam hackathon page: https://superteam.fun/earn/hackathon/world-cup/
- Terms: https://txline.txodds.com/documentation/legal/hackathon-terms
- Dev.to announcement: https://dev.to/neocarvajal/build-for-the-world-cup-on-solana-50000-txodds-hackathon-announced-4co4
- Global Gaming Insider: https://globalgaminginsider.com/news/5364/txodds-partners-with-solana-for-world-cup-hackathon

### Track 1: Prediction Markets and Settlement

Superteam listing: https://superteam.fun/earn/listing/prediction-markets-and-settlement/

Prize pool:

- Total: 18,000 USDT.
- 1st: 12,000 USDT.
- 2nd: 4,000 USDT.
- 3rd: 2,000 USDT.

What they are asking for:

- Markets powered by official/live match data.
- Settlement systems.
- Oracle tooling.
- On-chain verification systems.
- Any product where TxLINE data can serve as the truth source for outcome resolution.

Best interpretation: this is the most "crypto-native" track. They likely want demos that prove a market can be created, updated, and settled using TxLINE proofs or data streams. A simple UI is useful, but the winning angle is likely settlement integrity.

### Track 2: Trading Tools and Agents

Superteam listing: https://superteam.fun/earn/listing/trading-tools-and-agents/

Prize pool:

- Total: 16,000 USDT.
- 1st: 10,000 USDT.
- 2nd: 4,000 USDT.
- 3rd: 2,000 USDT.

What they are asking for:

- Agents that consume odds and match data.
- Tools that detect market opportunities.
- Automated or semi-automated strategy execution.
- Dashboards for traders, analysts, or betting-market operators.

Best interpretation: TxODDS wants to show that StablePrice plus live data can be useful for active markets. This track is probably less about general AI agent hype and more about data-driven trading workflows: alerts, arbitrage detection, odds movement analysis, market-making signals, latency-aware monitoring, and backtesting.

### Track 3: Consumer and Fan Experiences

Superteam listing: https://superteam.fun/earn/listing/consumer-and-fan-experiences/

Prize pool:

- Total: 16,000 USDT.
- 1st: 10,000 USDT.
- 2nd: 4,000 USDT.
- 3rd: 2,000 USDT.

What they are asking for:

- Consumer-facing apps using TxODDS/TxLINE live data.
- Fan engagement experiences around World Cup matches.
- Games, leaderboards, social prediction apps, live dashboards, fantasy-like products, or interactive match experiences.

Best interpretation: this is the broadest track. A winning app probably needs a polished demo and a clear reason why verifiable live data matters to users, not just a nice-looking match tracker.

## Grants or previous prizes

I searched for public evidence of:

- TxODDS grants.
- TxLINE grants.
- TxODDS bounties.
- TxLINE bounties.
- Previous hackathon winners.
- Prior TxODDS prize payouts.
- TxODDS on Superteam Earn outside the World Cup hackathon.
- ETHGlobal sponsor/bounty history.

Result: I found no clear public evidence that TxODDS or TxLINE previously ran grant programs or awarded completed hackathon prizes before this World Cup campaign. The public Superteam footprint I found is the current World Cup hackathon tracks. Superteam itself hosts many grants from other entities, but I did not find a TxODDS-specific recurring grant program.

Important nuance: this does not prove TxODDS has never privately funded developers, sponsored closed events, paid contractors, or run non-indexed/local programs. It only means I did not find reliable public evidence of previous public grants/prizes beyond the current $50,000 hackathon.

## What TxODDS ideally wants

Based on the hackathon brief, product launch, docs, and CEO quotes, TxODDS likely wants:

1. Proof that TxLINE can power real applications, not just infrastructure demos.

They are launching a data product. A hackathon is a distribution strategy. They want projects that show: "If sports data becomes easy, verifiable, and Solana-native, these new applications become possible."

2. Builders to attack the sports-betting trust problem.

Their repeated language is about transparency, tamper-evident audit trails, and breaking down traditional gatekeepers. Good projects should directly address a trust problem: settlement disputes, opaque odds history, manipulated data, unverifiable timestamps, or black-box operator behavior.

3. Functional builds over pitch decks.

The terms say submissions must be accessible for testing without TxODDS needing to pay fees, buy software, create wallets, or chase credentials. The announcement says qualifying teams need a functional build or live testnet application using TxLINE data as a primary input.

4. TxLINE data as the primary input.

This matters. A project that merely mentions TxLINE or uses it for a small widget is weak. A project where the business logic breaks without TxLINE is much stronger.

5. Smart use of Solana.

The product is built around Solana proofs and wallet/subscription access. Winning submissions likely use Solana for something meaningful: settlement, proof verification, escrow, market creation, payouts, proof storage, or composable accounts. A web2 dashboard alone may be less compelling unless it is very useful for traders/compliance.

6. World Cup relevance.

This campaign is built around the FIFA World Cup 2026. They are offering free World Cup data. Submissions should feel native to live football: match events, odds movement, group-stage scenarios, brackets, live score outcomes, fan activity, and game-time decisions.

7. Compliance awareness.

The terms repeatedly mention gambling law, restricted jurisdictions, KYC/compliance checks, no FIFA IP misuse, and no data redistribution. A project that handles betting/prediction markets should avoid looking legally careless. Even a hackathon demo should include obvious disclaimers, geofencing assumptions, testnet-only flows, or non-custodial/no-real-money framing where relevant.

## Product and technical hooks builders can exploit

### Real-time streams

TxLINE has Server-Sent Events endpoints for:

- `/api/odds/stream`
- `/api/scores/stream`

These can power:

- Live match rooms.
- Odds movement dashboards.
- Alerting bots.
- Trading signals.
- Automated market suspension/resume logic.
- "What changed in the last 30 seconds?" feeds.

Streaming docs: https://txline-docs.txodds.com/documentation/examples/streaming-data

### Historical snapshots

TxLINE has endpoints for latest snapshots and historical intervals. These are useful for:

- Backtesting strategies.
- Replay mode for demos.
- Dispute timelines.
- Market odds charts.
- Model training/evaluation.

### Merkle proofs and on-chain validation

This is the highest-leverage differentiator. A normal sports API can give a score. TxLINE can give a score plus a proof that the score/event was part of a committed batch.

Use cases:

- "This market settled because this proof validates."
- "This bet used odds that existed at this timestamp."
- "This agent acted on data that can be audited later."
- "This dashboard shows proof status for every update."

### StablePrice odds

TxLINE odds are powered by TxODDS' StablePrice engine, described as a consensus pricing engine that aggregates global operator lines, including sharp books, and filters stale/outlier/bad data.

This is useful for:

- Fair/reference price tools.
- Odds movement detection.
- Arbitrage scanners.
- Market-maker dashboards.
- Risk/compliance monitoring.

Odds overview: https://txline-docs.txodds.com/documentation/odds/overview

## Strong hackathon project ideas

### 1. Proof-settled prediction market

Build a testnet prediction market for World Cup match outcomes where markets are resolved using TxLINE score proofs. Include a simple UI for creating markets, buying positions, and seeing the proof used for settlement.

Why TxODDS would like it: directly proves the core settlement story.

### 2. Verifiable odds time machine

A dashboard where users pick a match and timestamp, then see odds snapshots, score state, and proof status. Add "replay mode" that shows how the market moved during the match.

Why TxODDS would like it: demonstrates backtesting, audit, and compliance value.

### 3. Trading agent cockpit

An agent consumes TxLINE live odds/scores, detects odds movement anomalies or arbitrage-like opportunities, and produces signed/reproducible trade recommendations. Keep execution simulated or testnet-only unless there is a safe target venue.

Why TxODDS would like it: fits the Trading Tools and Agents track while highlighting StablePrice.

### 4. Settlement API / SDK

A developer tool that wraps TxLINE proof fetching and Solana verification into a simple "resolve market" function. Include examples for full-time winner, over/under, score differential, and both-teams-to-score.

Why TxODDS would like it: expands developer adoption and makes TxLINE easier to use.

### 5. Fan prediction league with proof reveal

A consumer app where fans make free predictions before/during matches, compete on leaderboards, and see results resolved with TxLINE proof badges.

Why TxODDS would like it: good Consumer/Fan track fit, safer than real-money betting, still demonstrates verifiable data.

### 6. Compliance receipt generator

For each odds/score decision, generate an audit receipt: timestamp, fixture, data point, Merkle proof, Solana root, validation status, and human-readable explanation.

Why TxODDS would like it: maps directly to "tamper-evident audit trail for backtesting, compliance, and automated smart contract verification."

## Submission advice

The strongest submission should answer these questions clearly:

- What TxLINE data does the app use?
- Is TxLINE the primary input or just decoration?
- What does Solana verify?
- Where is the Merkle proof shown or used?
- What happens live during a match?
- What is the user or operator problem?
- Can judges test it without paying, creating extra accounts, or configuring complex infra?
- Is the project legally careful around gambling, FIFA marks, and data redistribution?

Practical build priorities:

- Start with one match flow end to end.
- Make proof/verification visible in the UI.
- Have a replay/demo mode in case no live match is happening during judging.
- Use testnet/devnet for contracts and simulated funds.
- Avoid real-money betting unless you fully understand jurisdictional risk.
- Include a short judge guide with test credentials and a one-command/demo path.
- Do not rely on FIFA branding, logos, or protected marks.

## Risks and constraints from terms

Key terms to respect:

- Participants must be 18+ and legally able to participate.
- Employees/contractors/officers of TxODDS and close household/family exclusions apply.
- Teams can be no more than 3 people.
- Submissions must be original work created during the hackathon period; public open-source components are allowed if attributed.
- Projects must be accessible for judges to test without requiring them to pay fees, buy software, buy tokens, create third-party wallets/accounts, or incur expenses.
- Entries must be created and submitted by human participants. Automated systems/bots/autonomous agents cannot register, participate, or submit entries.
- Participants must comply with gambling/gambling-tech laws.
- TxODDS can exclude restricted/prohibited jurisdictions.
- TxODDS data is licensed only for hackathon participation.
- Participants cannot redistribute, publish, sublicense, sell, share, extract, reconstruct, replicate, or create competing products using the data/APIs/methodologies.
- No FIFA branding/marks/affiliation is granted.
- Participants retain project IP, but grant TxODDS and partners a broad license to use, display, test, promote, and showcase submissions.
- TxODDS is not obligated to fund, acquire, license, commercialize, or work with any submission after the hackathon.
- TxODDS reserves the right not to award prizes if submissions do not meet the required standard.
- Prize payments may be subject to identity, eligibility, and compliance checks.

Terms source: https://txline.txodds.com/documentation/legal/hackathon-terms

## Source list

- TxLINE product page: https://txodds.net/our-products/tx-line/
- TxODDS official hackathon announcement: https://txodds.net/resources/txodds-launches-world-cup-hackathon-with-solana/
- TxLINE quickstart: https://txline-docs.txodds.com/documentation/quickstart
- TxLINE docs index: https://txline-docs.txodds.com/llms.txt
- TxLINE subscription tiers: https://txline-docs.txodds.com/documentation/subscription-tiers
- TxLINE odds overview: https://txline-docs.txodds.com/documentation/odds/overview
- TxLINE streaming data example: https://txline-docs.txodds.com/documentation/examples/streaming-data
- TxLINE on-chain validation example: https://txline-docs.txodds.com/documentation/examples/onchain-validation
- TxLINE program addresses: https://txline.txodds.com/documentation/programs/addresses
- TxODDS GitHub repo: https://github.com/txodds/tx-on-chain
- Hackathon terms: https://txline.txodds.com/documentation/legal/hackathon-terms
- Superteam Prediction Markets and Settlement listing: https://superteam.fun/earn/listing/prediction-markets-and-settlement/
- Superteam Trading Tools and Agents listing: https://superteam.fun/earn/listing/trading-tools-and-agents/
- Superteam Consumer and Fan Experiences listing: https://superteam.fun/earn/listing/consumer-and-fan-experiences/
- Dev.to hackathon announcement: https://dev.to/neocarvajal/build-for-the-world-cup-on-solana-50000-txodds-hackathon-announced-4co4
- Global Gaming Insider coverage: https://globalgaminginsider.com/news/5364/txodds-partners-with-solana-for-world-cup-hackathon
- AGB coverage: https://agbrief.com/news/world/17/06/2026/txodds-releases-txline-ahead-of-the-fifa-world-cup-2026/
- Superteam Ireland LinkedIn post: https://www.linkedin.com/posts/superteam-ireland_the-solana-ecosystem-is-no-stranger-to-world-activity-7475586310347571200-P6rU

## Bottom line

TxODDS is not just handing out random sponsor prizes. It is using a $50,000 World Cup hackathon to seed examples around TxLINE, its Solana-verifiable sports data layer. The best projects will not be generic sports apps. They will make the verification useful: proof-settled markets, auditable odds history, trading tools built around StablePrice, and fan experiences where live World Cup data is the core mechanic.

