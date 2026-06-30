/**
 * TxLINE devnet — https://txline.txodds.com/documentation/programs/addresses
 * World Cup free tier — https://txline.txodds.com/documentation/worldcup
 * Subscription tiers — https://txline.txodds.com/documentation/subscription-tiers
 */
export const COPIUM_NETWORK = "devnet" as const;

/** Locked copium.fun TxLINE plan: World Cup free tier only (hackathon / Season 0). */
export const TXLINE_WORLDCUP_FREE_TIER = {
  /** World Cup & Int Friendlies · 60s delay · free (devnet + mainnet). */
  serviceLevelDelayed: 1,
  /** World Cup & Int Friendlies · real-time · free (mainnet only). */
  serviceLevelRealtime: 12,
  /** Docs: multiples of 4 weeks (28 days), min 4 weeks. */
  durationWeeks: 4,
  /** Standard bundle — empty, not custom league selection. */
  selectedLeagues: [] as const,
  bundle: "World Cup & Int Friendlies",
  delayLabel: "60 seconds",
  price: "free",
  docUrl: "https://txline.txodds.com/documentation/worldcup",
} as const;

export const TXLINE_DEVNET = {
  programId: "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J",
  txlTokenMint: "4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG",
  usdtMint: "ELWTKspHKCnCfCiCiqYw1EDH77k8VCP74dK9qytG2Ujh",
  apiHost: "https://txline-dev.txodds.com",
  apiBase: "https://txline-dev.txodds.com/api/",
  guestAuth: "https://txline-dev.txodds.com/auth/guest/start",
  openApi: "https://txline-dev.txodds.com/docs/docs.yaml",
  /** Devnet pricing matrix documents only WC free tier row 1. */
  worldCupFreeServiceLevel: TXLINE_WORLDCUP_FREE_TIER.serviceLevelDelayed,
  /** @deprecated use worldCupFreeServiceLevel */
  subscriptionTier: TXLINE_WORLDCUP_FREE_TIER.serviceLevelDelayed,
} as const;

export const SOLANA_DEVNET = {
  cluster: "devnet" as const,
  rpcUrl: "https://api.devnet.solana.com",
} as const;

export const COPIUM_TAGLINE = "Every moment is a market." as const;
