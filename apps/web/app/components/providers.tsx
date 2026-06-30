"use client";

import { SolanaProvider } from "@solana/react-hooks";
import { PropsWithChildren } from "react";

import { SOLANA_DEVNET } from "@copium/config";
import { autoDiscover, createClient } from "@solana/client";

const client = createClient({
  endpoint: SOLANA_DEVNET.rpcUrl,
  walletConnectors: autoDiscover(),
});

export function Providers({ children }: PropsWithChildren) {
  return <SolanaProvider client={client}>{children}</SolanaProvider>;
}
