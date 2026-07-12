"use client";

import { ArrowRight, Check, Flame, Trophy, Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

export function MarketingLanding() {
  return (
    <main className="marketing-page">
      <header className="marketing-nav">
        <Link href="/" className="marketing-logo">
          <span>c</span>copium<em>.fun</em>
        </Link>
        <nav>
          <a href="#how">How it works</a>
          <a href="#compete">Compete</a>
          <a href="#rooms">Rooms</a>
        </nav>
        <Link href="/dashboard" className="marketing-enter">
          Enter the app <ArrowRight />
        </Link>
      </header>

      <section className="marketing-hero">
        <motion.div
          className="marketing-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <span className="marketing-kicker">
            <i /> WORLD CUP 2026 · EVERY MOMENT
          </span>
          <h1>
            Don’t just watch
            <br />
            the match. <em>Call it.</em>
          </h1>
          <p>
            Predict the next shot, goal, corner or foul. Build a streak, beat
            your friends, and turn match instinct into winnings.
          </p>
          <div>
            <Link href="/dashboard" className="marketing-cta">
              Enter World Cup mode <ArrowRight />
            </Link>
            <span>
              <Users /> 24,190 playing tonight
            </span>
          </div>
        </motion.div>
        <motion.div
          className="hero-ticket-stage"
          initial={{ opacity: 0, rotate: 4, x: 35 }}
          animate={{ opacity: 1, rotate: -2, x: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
        >
          <article className="hero-ticket">
            <header>
              <span>FULL-TIME · TUE, 7 JUL</span>
              <span>WORLD CUP 2026 · ROUND OF 16</span>
            </header>
            <div className="hero-score">
              <span>
                <b>A</b>Argentina
              </span>
              <strong>3 — 2</strong>
              <span>
                <b>E</b>Egypt
              </span>
            </div>
            <small>NEXT PLAY</small>
            <h2>Can you call the comeback before it happens?</h2>
            <p>
              Replay Romero 79′, Messi 83′ and Enzo 90+3′ through TxLINE-shaped
              match frames.
            </p>
            <div className="hero-ticket-stakes">
              <span>PLAY FOR</span>
              <b>$1</b>
              <b className="selected">$5</b>
              <b>$10</b>
            </div>
            <footer>
              <button>← YES</button>
              <button>NO →</button>
            </footer>
          </article>
          <span className="ticket-note">
            <Flame /> 6 pick streak
          </span>
        </motion.div>
      </section>

      <section className="landing-proof">
        <span>WORLD CUP 2026</span>
        <span>FAST PREDICTIONS</span>
        <span>PRIVATE ROOMS</span>
        <span>REAL REWARDS</span>
      </section>

      <section className="how-section" id="how">
        <div>
          <span className="marketing-kicker">THE WHOLE GAME, IN YOUR HAND</span>
          <h2>
            One card.
            <br />
            One instinct.
            <br />
            <em>Three seconds.</em>
          </h2>
        </div>
        <div className="how-steps">
          <article>
            <span>01</span>
            <h3>Pick a World Cup match</h3>
            <p>
              See what’s happening now, who’s playing, and what’s in the prize
              pool.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Call the next moment</h3>
            <p>
              Swipe through quick predictions. Choose your amount and lock your
              answer.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Climb as it unfolds</h3>
            <p>
              Correct calls build streaks, move your rank, and take you closer
              to a prize.
            </p>
          </article>
        </div>
      </section>

      <section className="social-section" id="compete">
        <div className="social-card">
          <Trophy />
          <span>LIVE RANK</span>
          <strong>#17</strong>
          <p>Up 8 places since kick-off</p>
          <i>
            <b />
          </i>
        </div>
        <div>
          <span className="marketing-kicker">
            MORE FUN WITH SOMETHING ON IT
          </span>
          <h2>
            Play for yourself.
            <br />
            Win for your side.
          </h2>
          <p>
            Every correct prediction moves your personal rank and adds to your
            supporters’ score. Join the rivalry or keep it between friends.
          </p>
          <ul>
            <li>
              <Check /> Match leaderboards that update live
            </li>
            <li>
              <Check /> Team-versus-team supporter battles
            </li>
            <li>
              <Check /> Private rooms with your own prize pool
            </li>
          </ul>
          <Link href="/dashboard">
            See tonight’s matches <ArrowRight />
          </Link>
        </div>
      </section>

      <section className="landing-close" id="rooms">
        <span>YOUR GROUP CHAT HAS OPINIONS.</span>
        <h2>Give them a leaderboard.</h2>
        <p>
          Create a private room, invite your people, and settle who actually
          knows ball.
        </p>
        <Link href="/dashboard">
          Create your room <ArrowRight />
        </Link>
      </section>
      <footer className="marketing-footer">
        <span>copium.fun</span>
        <p>
          Live sports predictions for people who can’t keep their takes to
          themselves.
        </p>
        <small>© 2026</small>
      </footer>
    </main>
  );
}
