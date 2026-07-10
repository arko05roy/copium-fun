"use client";

import { useWalletConnection } from "@solana/react-hooks";
import { Bot, FileCheck2, Radio, Wallet, Waves } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/feed", label: "Pulses", icon: Radio },
  { href: "/desk", label: "Bots", icon: Bot },
  { href: "/proof", label: "Proof", icon: FileCheck2 },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const { wallet, status, connect, connectors, disconnect } = useWalletConnection();
  const address = wallet?.account.address.toString();

  const connectWallet = () => {
    const preferred = connectors.find((connector) => /phantom/i.test(connector.name));
    void connect(preferred?.id ?? connectors[0]?.id ?? "");
  };

  if (pathname.startsWith("/sim")) return null;

  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <Link href="/" className="site-nav__brand" aria-label="copium.fun home">
          <span className="site-nav__mark"><Waves aria-hidden /></span>
          <span>copium<span>.fun</span></span>
        </Link>

        <nav className="site-nav__links" aria-label="Primary navigation">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={active ? "is-active" : ""}>
                <Icon aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="site-nav__account">
          <span className="site-nav__network"><i /> splash zone · devnet</span>
          {status === "connected" && address ? (
            <button onClick={() => disconnect()} title="Disconnect wallet">
              {address.slice(0, 4)}…{address.slice(-4)}
            </button>
          ) : (
            <button onClick={connectWallet} className="site-nav__connect">
              <Wallet aria-hidden /> Connect wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
