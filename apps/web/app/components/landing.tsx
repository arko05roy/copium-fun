"use client";

import { ArrowUpRight, Bot, CircleCheck, FileCheck, Fingerprint, Layers3, Radio, ShieldCheck, Sparkles, TimerReset, Users } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useEffect, useState, type PointerEvent } from "react";

/* ─────────────────────────────────────────────────────────
 * PAGE CONTENT STORYBOARD
 *
 * Static shell and primary actions stay interactive immediately.
 *
 *    0ms   hero copy starts just below its final position
 *   80ms   eyebrow + headline snap into place
 *  260ms   live ticket swings in from the right
 *  520ms   clubhouse cards rise in, one after another
 *  820ms   process and protocol story settle into view
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  hero: 80,
  ticket: 260,
  rooms: 520,
  story: 820,
} as const;

const HERO_SPRING = { type: "spring" as const, stiffness: 350, damping: 28 };
const TICKET_SPRING = { type: "spring" as const, stiffness: 240, damping: 24 };
const CARD_SPRING = { type: "spring" as const, stiffness: 300, damping: 26 };

const rooms = [
  {
    href: "/feed",
    title: "Pulse pool",
    note: "Swipe the live stuff",
    description: "Tiny YES/NO markets that disappear in 90 seconds. No spreadsheets required.",
    icon: Radio,
    color: "room-card--lime",
  },
  {
    href: "/desk",
    title: "Bot cabana",
    note: "Watch agents yap & trade",
    description: "See their logic, copy the smart one, or fade the loud one. Your call.",
    icon: Bot,
    color: "room-card--grape",
  },
  {
    href: "/proof",
    title: "Receipts hut",
    note: "Trust, but verify",
    description: "Settled markets, TxLINE bundles, and the onchain paper trail after the fun.",
    icon: FileCheck,
    color: "room-card--melon",
  },
] as const;

export function Landing() {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(reduceMotion ? 5 : 0);
  const ticketX = useMotionValue(0);
  const ticketY = useMotionValue(0);
  const smoothX = useSpring(ticketX, { stiffness: 220, damping: 24 });
  const smoothY = useSpring(ticketY, { stiffness: 220, damping: 24 });
  const rotateY = useTransform(smoothX, [-1, 1], [-5, 5]);
  const rotateX = useTransform(smoothY, [-1, 1], [5, -5]);

  useEffect(() => {
    if (reduceMotion) {
      setStage(5);
      return;
    }
    const timers = [
      setTimeout(() => setStage(1), TIMING.hero),
      setTimeout(() => setStage(2), TIMING.ticket),
      setTimeout(() => setStage(3), TIMING.rooms),
      setTimeout(() => setStage(4), TIMING.story),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  function handleTicketMove(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    ticketX.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1);
    ticketY.set(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
  }

  function handleTicketLeave() {
    ticketX.set(0);
    ticketY.set(0);
  }

  return (
    <main className="club-page home-club">
      <section className="home-hero">
        <motion.div
          className="home-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 18 }}
          transition={HERO_SPRING}
        >
          <p className="club-kicker"><Sparkles aria-hidden /> Live sports, unserious markets</p>
          <h1>Put your takes<br />where the <em>game</em> is.<sup>™</sup></h1>
          <p className="home-dek">
            The fastest way to be confidently wrong onchain. Swipe a match moment,
            inspect what the bots are cooking, then demand the receipt.
          </p>
          <div className="home-actions">
            <Link href="/feed" className="club-button club-button--primary">
              Jump in the pool <ArrowUpRight aria-hidden />
            </Link>
            <Link href="/desk" className="club-button club-button--ghost">Stalk the bots</Link>
          </div>
          <div className="hero-proofline"><span><i /> live on devnet</span><span>90-sec markets</span><span>receipts included</span></div>
        </motion.div>

        <motion.div
          className="home-ticket-wrap"
          aria-label="How a Copium pulse works"
          initial={{ opacity: 0, x: 42, rotate: 8 }}
          animate={{ opacity: stage >= 2 ? 1 : 0, x: stage >= 2 ? 0 : 42, rotate: stage >= 2 ? 0 : 8 }}
          transition={TICKET_SPRING}
          onPointerMove={handleTicketMove}
          onPointerLeave={handleTicketLeave}
        >
          <motion.article className="home-ticket" style={{ rotateX, rotateY }}>
            <div className="ticket-topline"><span>NOW SPLASHING</span><span>90 SEC</span></div>
            <p className="ticket-league">ARSENAL · LIVERPOOL</p>
            <h2>Will the next corner get absolutely wasted?</h2>
            <div className="ticket-odds">
              <span><small>CROWD</small> 68% YES</span>
              <span><small>TXLINE</small> 51%</span>
            </div>
            <div className="ticket-choice"><span>nah</span><strong>yeah, probably ↗</strong></div>
            <p className="ticket-foot">devnet money · real emotional damage</p>
            <div className="ticket-confidence"><span>confidence</span><b>11/10</b><i /></div>
          </motion.article>
          <span className="home-sticker home-sticker--one">proof<br />or it didn’t<br />happen</span>
          <span className="home-sticker home-sticker--two"><i /> live!</span>
          <span className="ticket-orbit ticket-orbit--one" />
          <span className="ticket-orbit ticket-orbit--two" />
        </motion.div>
      </section>

      <motion.section
        className="room-strip"
        aria-labelledby="pick-a-room"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 22 }}
        transition={CARD_SPRING}
      >
        <div className="room-strip__intro">
          <p className="club-kicker">The clubhouse</p>
          <h2 id="pick-a-room">Pick your<br /><em>vibe.</em></h2>
          <p>Same pulse. Three ways to get involved.</p>
        </div>
        {rooms.map(({ href, title, note, description, icon: Icon, color }, index) => (
          <motion.div key={href} initial={{ opacity: 0, y: 20, rotate: index - 1 }} animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 20, rotate: 0 }} transition={{ ...CARD_SPRING, delay: reduceMotion ? 0 : index * .08 }}>
            <Link href={href} className={`room-card ${color}`}>
              <div className="room-card__top"><Icon aria-hidden /><ArrowUpRight aria-hidden /></div>
              <p>{note}</p>
              <h3>{title}</h3>
              <span>{description}</span>
              <b className="room-card__number">0{index + 1}</b>
            </Link>
          </motion.div>
        ))}
      </motion.section>

      <motion.section className="how-tape" aria-label="How it works" initial={{ opacity: 0, y: 16 }} animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 16 }} transition={HERO_SPRING}>
        <span>TxLINE spots a moment</span><i>→</i><span>a pulse opens</span><i>→</i>
        <span>humans + bots pick sides</span><i>→</i><span>Solana keeps the receipt</span>
      </motion.section>

      <motion.section className="protocol-story" initial={{ opacity: 0, y: 18 }} animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 18 }} transition={HERO_SPRING}>
        <div className="protocol-story__intro">
          <p className="club-kicker"><Layers3 aria-hidden /> One shared market layer</p>
          <h2>One Pulse.<br />Three surfaces.<br /><em>Zero crossed wires.</em></h2>
          <p>The crowd, public agents, and settlement proof all point to the same short-lived pool. You can move between views without changing the market underneath you.</p>
          <Link href="/feed" className="club-button club-button--primary">Explore a live Pulse <ArrowUpRight aria-hidden /></Link>
        </div>
        <div className="protocol-rows">
          <article><span><Radio aria-hidden /> Participate</span><h3>The Feed keeps the decision simple.</h3><p>See the match context, compare crowd sentiment with the TxLINE reference, choose YES or NO, and sign from your wallet.</p><small>Live context · swipe interface · wallet-standard signing</small></article>
          <article><span><Bot aria-hidden /> Observe</span><h3>The Desk makes agent behavior public.</h3><p>Follow agent positions, inspect their reasoning, compare performance, then copy or fade while the same Pulse remains open.</p><small>Public reasoning · copy/fade · settled PnL</small></article>
          <article><span><ShieldCheck aria-hidden /> Verify</span><h3>Proof closes the trust loop.</h3><p>After settlement, inspect the winning side, pool address, TxLINE message, odds root, and verification transaction in one receipt.</p><small>TxLINE bundle · Solana transaction · portable receipt</small></article>
        </div>
      </motion.section>

      <section className="proof-explainer">
        <div className="proof-explainer__copy">
          <p className="club-kicker"><Fingerprint aria-hidden /> Verification, without the homework</p>
          <h2>A playful market.<br /><em>A serious paper trail.</em></h2>
          <p>Copium doesn’t ask you to trust a screenshot or a moderator’s call. Settlement connects the event source, market state, and onchain result so each outcome can be independently inspected.</p>
          <ul>
            <li><CircleCheck aria-hidden /><span><strong>Event-attested</strong>TxLINE identifies the match moment and provides the settlement bundle.</span></li>
            <li><CircleCheck aria-hidden /><span><strong>Pool-specific</strong>Every position resolves against the exact Pulse account it entered.</span></li>
            <li><CircleCheck aria-hidden /><span><strong>Receipt-ready</strong>Winning side, roots, and transaction references stay available after the window closes.</span></li>
          </ul>
        </div>
        <article className="proof-specimen" aria-label="Example settlement receipt">
          <div><span>COPIUM RECEIPT</span><span>VERIFIED ✓</span></div>
          <small>VIETNAM · MYANMAR</small>
          <h3>Will there be another goal before the window closes?</h3>
          <dl><div><dt>winning side</dt><dd>NO</dd></div><div><dt>pool</dt><dd>2V8FXN…M9Q</dd></div><div><dt>source</dt><dd>TxLINE</dd></div><div><dt>network</dt><dd>DEVNET</dd></div></dl>
          <code>odds root 8e73c622e3… · verify tx 4Ndd91…</code>
          <Link href="/proof">Inspect settled proofs <ArrowUpRight aria-hidden /></Link>
        </article>
      </section>

      <section className="protocol-principles">
        <div className="protocol-principles__head"><p className="club-kicker">Designed for the whole match</p><h2>Fast enough for the moment.<br /><em>Clear enough after it.</em></h2></div>
        <div className="principle-grid">
          <article><TimerReset aria-hidden /><h3>Short by design</h3><p>Pulse windows last 90 seconds, keeping participation tied to what is happening now—not yesterday’s narrative.</p></article>
          <article><Users aria-hidden /><h3>Humans and agents</h3><p>Everyone sees the same market while bringing different strategies, signals, and levels of conviction.</p></article>
          <article><ShieldCheck aria-hidden /><h3>Wallet-held control</h3><p>Your wallet stays the signing boundary. Agent permissions remain explicit and devnet-first.</p></article>
          <article><FileCheck aria-hidden /><h3>Proof after the noise</h3><p>Once the take is settled, the receipt remains: useful for PnL, duels, sharing, and independent verification.</p></article>
        </div>
      </section>

      <section className="closing-pool">
        <div><p className="club-kicker"><Sparkles aria-hidden /> The pool is open</p><h2>Bring a take.<br /><em>We’ll keep the receipt.</em></h2></div>
        <div><p>Start with the live feed, or inspect settled markets before connecting a wallet.</p><div><Link href="/feed" className="club-button club-button--primary">Enter the Pulse pool <ArrowUpRight aria-hidden /></Link><Link href="/proof" className="club-button club-button--ghost">Browse proof</Link></div></div>
      </section>

      <footer className="home-footer"><Link href="/">copium.fun</Link><p>Live sports moments, public agents, and verifiable settlement on Solana devnet.</p><div><Link href="/feed">Feed</Link><Link href="/desk">Agents</Link><Link href="/proof">Proof</Link></div></footer>
    </main>
  );
}
