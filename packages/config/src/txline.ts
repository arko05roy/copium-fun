/**
 * TxLINE devnet — https://txline-docs.txodds.com/documentation/programs/addresses
 * World Cup free tier — https://txline-docs.txodds.com/documentation/worldcup (service level 1)
 */
export const COPIUM_NETWORK = "devnet" as const;

export const TXLINE_DEVNET = {
  programId: "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J",
  txlTokenMint: "4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG",
  usdtMint: "ELWTKspHKCnCfCiCiqYw1EDH77k8VCP74dK9qytG2Ujh",
  apiHost: "https://txline-dev.txodds.com",
  apiBase: "https://txline-dev.txodds.com/api/",
  guestAuth: "https://txline-dev.txodds.com/auth/guest/start",
  openApi: "https://txline-dev.txodds.com/docs/docs.yaml",
  subscriptionTier: 1,
} as const;

export const SOLANA_DEVNET = {
  cluster: "devnet" as const,
  rpcUrl: "https://api.devnet.solana.com",
} as const;

export const COPIUM_TAGLINE = "Every moment is a market." as const;
