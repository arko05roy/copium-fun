import type { Metadata } from "next";

import { Feed } from "../components/feed";

export const metadata: Metadata = {
  title: "Match feed · copium.fun",
  description: "Swipe YES/NO on 90-second Pulses. Crowd vs line on Solana devnet.",
};

export default function FeedPage() {
  return <Feed />;
}
