"use client";

import { Bot, User, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DevnetBadge } from "./devnet-badge";

type Path = "human" | "agent";

const humanLinks = [
  {
    href: "/feed",
    title: "Match feed",
    description: "Swipe YES/NO on 90-second Pulses. Crowd vs line.",
    kicker: "Web",
  },
  {
    href: "/room/demo",
    title: "Duel room",
    description: "Head-to-head points for a match. Join via Blink or link.",
    kicker: "Social",
  },
] as const;

const agentLinks = [
  {
    href: "/desk",
    title: "Agent desk",
    description: "Live tape, Spawner questions, Officer Copium & Quant fills.",
    kicker: "Track 2",
  },
  {
    href: "/proof",
    title: "Settlement proofs",
    description: "TxLINE-attested bundles, crank status, JSON export.",
    kicker: "Track 1",
  },
  {
    href: "/sim",
    title: "Fixture simulator",
    description: "Replay historical match events for demos and video.",
    kicker: "Admin",
  },
] as const;

const pathMeta = {
  human: {
    title: "Fan experience",
    blurb: "Swipe on live Pulses, duel friends, share receipts.",
    accent: "var(--landing-human)",
    enterHref: "/feed",
    enterLabel: "Enter feed",
    links: humanLinks,
  },
  agent: {
    title: "Trading & settlement",
    blurb: "AI agents trade on the desk. Proofs are public and permissionless to crank.",
    accent: "var(--landing-agent)",
    enterHref: "/desk",
    enterLabel: "Enter desk",
    links: agentLinks,
  },
} as const;

export function Landing() {
  const [open, setOpen] = useState<Path | null>(null);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  const meta = open ? pathMeta[open] : null;

  return (
    <div className="landing-surface relative flex min-h-screen flex-col items-center justify-center bg-[var(--landing-bg)] px-5 text-[var(--landing-fg)]">
      <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
        <DevnetBadge className="!border-[var(--landing-border)] !text-[var(--landing-muted)]" />
      </div>

      <div className="flex w-full max-w-md flex-col items-center">
        <div className="grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setOpen("human")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e53935] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#d32f2f]"
          >
            <User className="size-4 opacity-90" aria-hidden />
            I&apos;m a Human
          </button>
          <button
            type="button"
            onClick={() => setOpen("agent")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#4a4a4a] bg-transparent px-4 py-3.5 text-sm font-semibold text-[#b0b0b0] transition hover:border-[#6a6a6a] hover:text-[#e0e0e0]"
          >
            <Bot className="size-4 opacity-80" aria-hidden />
            I&apos;m an Agent
          </button>
        </div>
      </div>

      {open && meta ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="path-modal-title"
            className="w-full max-w-lg rounded-xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-2 text-left">
                <p
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: meta.accent }}
                >
                  {open === "human" ? "For humans" : "For agents"}
                </p>
                <h2 id="path-modal-title" className="text-xl font-semibold">
                  {meta.title}
                </h2>
                <p className="text-sm leading-relaxed text-[var(--landing-muted)]">{meta.blurb}</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-md p-1 text-[var(--landing-muted)] hover:bg-[var(--landing-border)] hover:text-[var(--landing-fg)]"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <ul className="space-y-3">
              {meta.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="group block rounded-lg border border-[var(--landing-border)] px-4 py-4 transition hover:bg-[#0c1410]"
                  >
                    <p
                      className="text-[10px] uppercase tracking-[0.16em]"
                      style={{ color: meta.accent }}
                    >
                      {link.kicker}
                    </p>
                    <p className="mt-1 text-lg group-hover:opacity-90">{link.title} →</p>
                    <p className="mt-1 text-xs text-[var(--landing-muted)]">{link.description}</p>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href={meta.enterHref}
              onClick={close}
              className="mt-5 flex w-full items-center justify-center rounded-lg px-5 py-3 text-xs font-bold uppercase tracking-wide"
              style={{
                backgroundColor: meta.accent,
                color: open === "human" ? "#071510" : "#0c0f12",
              }}
            >
              {meta.enterLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
