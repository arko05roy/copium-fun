import { getRoomBySlug, loadEnv } from "@copium/db";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { DevnetBadge } from "../../components/devnet-badge";

loadEnv();

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-room-display",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-room-body",
  display: "swap",
});

type PageProps = { params: Promise<{ slug: string }> };

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) return { title: "Room not found · copium.fun" };
  return {
    title: `Join ${room.slug} · copium.fun`,
    description: `Match-scoped duel room on Solana devnet.`,
  };
}

export default async function RoomPage({ params }: PageProps) {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  const actionUrl = `${siteBase()}/api/actions/join-room/${room.id}`;
  const blinkUrl = `https://dial.to/?action=${encodeURIComponent(actionUrl)}`;

  return (
    <div
      className={`${fraunces.variable} ${plexSans.variable} min-h-screen bg-[#071510] text-[#F4FFF7]`}
      style={{ fontFamily: "var(--font-room-body), system-ui, sans-serif" }}
    >
      <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-5 py-12">
        <header className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.2em] text-[#7CB892] hover:text-[#B8FF57]"
          >
            copium.fun
          </Link>
          <DevnetBadge />
        </header>

        <article className="flex flex-1 flex-col gap-6 border border-[#2A4D38] bg-[#122018] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7CB892]">Match room</p>
          <h1
            className="text-3xl leading-tight"
            style={{ fontFamily: "var(--font-room-display), Georgia, serif" }}
          >
            {room.slug}
          </h1>
          <p className="text-sm leading-relaxed text-[#9BB8A8]">
            Join this fixture duel room. Each settled Pulse awards H2H points — CERTIFIED shame,
            PROPHETIC glory.
          </p>
          <dl className="grid gap-2 font-mono text-xs text-[#6E9080]">
            <div className="flex justify-between border-b border-[#2A4D38] py-2">
              <dt>fixture</dt>
              <dd>{room.fixture_id ?? "—"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt>room id</dt>
              <dd className="truncate pl-4">{room.id}</dd>
            </div>
          </dl>
        </article>

        <div className="flex flex-col gap-3">
          <a
            href={blinkUrl}
            className="inline-flex items-center justify-center bg-[#B8FF57] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[#071510] transition hover:bg-[#d4ff8a]"
          >
            Join via Blink
          </a>
          <p className="text-center text-[10px] text-[#5A7A68]">
            Opens dial.to · signs with Phantom devnet
          </p>
        </div>
      </div>
    </div>
  );
}
