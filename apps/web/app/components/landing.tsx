"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  Crown,
  Flame,
  Goal,
  House,
  BarChart3 as Leaderboard,
  LockKeyhole,
  Plus,
  Settings2,
  Shirt,
  ShieldCheck,
  Star,
  Sparkles,
  Trophy,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { WorldCupTxLineFrame } from "@/lib/world-cup-txline";

type Screen =
  | "home"
  | "lobby"
  | "play"
  | "fantasy"
  | "rooms"
  | "leaders"
  | "wallet"
  | "profile";
type Pick = "YES" | "NO" | "SKIP";

const predictions = [
  {
    question: "Will Argentina score the next goal?",
    category: "NEXT PLAY",
    time: "00:18",
    context: "Argentina have taken 4 of the last 5 attempts.",
    stat: "74%",
    multiplier: "1.8×",
    player: "Lionel Messi",
  },
  {
    question: "Will the next event be a corner?",
    category: "5 MIN WINDOW",
    time: "00:14",
    context: "Egypt are protecting a two-goal lead with 20 minutes left.",
    stat: "61%",
    multiplier: "2.1×",
    player: "Match event",
  },
  {
    question: "Will Messi score before 90:00?",
    category: "PLAYER",
    time: "00:21",
    context: "2 shots on target · 0.72 expected goals tonight.",
    stat: "48%",
    multiplier: "2.6×",
    player: "Lionel Messi",
  },
  {
    question: "Will the next whistle be for a foul?",
    category: "NEXT PLAY",
    time: "00:16",
    context: "Four fouls in the last eight minutes.",
    stat: "67%",
    multiplier: "1.9×",
    player: "Match event",
  },
];

const people = [
  ["1", "MayaKicks", "2,890", "82%", "9", "$24.60", "MK"],
  ["2", "CornerKing", "2,740", "79%", "7", "$19.20", "CK"],
  ["3", "Riya", "2,510", "76%", "6", "$16.80", "RI"],
  ["17", "You", "1,320", "74%", "7", "$9.20", "YO"],
  ["18", "NicoLFC", "1,240", "72%", "4", "$8.40", "NL"],
  ["19", "Sam99", "1,185", "70%", "3", "$7.60", "S9"],
  ["20", "Dev", "1,120", "68%", "0", "$6.90", "DE"],
];

type FantasyPlayer = {
  id: number;
  name: string;
  team: "ARG" | "EGY";
  role: "GK" | "DEF" | "MID" | "FWD";
  credits: number;
  form: string;
  points: number;
};
const fantasyPlayers: FantasyPlayer[] = [
  {
    id: 1,
    name: "Emiliano Martínez",
    team: "ARG",
    role: "GK",
    credits: 8.5,
    form: "7.2",
    points: 34,
  },
  {
    id: 2,
    name: "Mohamed El Shenawy",
    team: "EGY",
    role: "GK",
    credits: 8.5,
    form: "6.8",
    points: 28,
  },
  {
    id: 3,
    name: "Cristian Romero",
    team: "ARG",
    role: "DEF",
    credits: 9,
    form: "7.6",
    points: 48,
  },
  {
    id: 4,
    name: "Nicolás Otamendi",
    team: "ARG",
    role: "DEF",
    credits: 9,
    form: "7.4",
    points: 52,
  },
  {
    id: 5,
    name: "Nahuel Molina",
    team: "ARG",
    role: "DEF",
    credits: 8,
    form: "7.0",
    points: 39,
  },
  {
    id: 6,
    name: "Yasser Ibrahim",
    team: "EGY",
    role: "DEF",
    credits: 8.5,
    form: "7.3",
    points: 42,
  },
  {
    id: 7,
    name: "Ahmed Hegazi",
    team: "EGY",
    role: "DEF",
    credits: 8,
    form: "7.1",
    points: 45,
  },
  {
    id: 8,
    name: "Enzo Fernández",
    team: "ARG",
    role: "MID",
    credits: 8.5,
    form: "7.5",
    points: 58,
  },
  {
    id: 9,
    name: "Alexis Mac Allister",
    team: "ARG",
    role: "MID",
    credits: 8,
    form: "7.2",
    points: 51,
  },
  {
    id: 10,
    name: "Mostafa Zico",
    team: "EGY",
    role: "MID",
    credits: 9.5,
    form: "8.0",
    points: 72,
  },
  {
    id: 11,
    name: "Hamdy Fathy",
    team: "EGY",
    role: "MID",
    credits: 9,
    form: "7.8",
    points: 64,
  },
  {
    id: 12,
    name: "Trézéguet",
    team: "EGY",
    role: "MID",
    credits: 9,
    form: "7.9",
    points: 69,
  },
  {
    id: 13,
    name: "Lionel Messi",
    team: "ARG",
    role: "FWD",
    credits: 10,
    form: "8.4",
    points: 88,
  },
  {
    id: 14,
    name: "Julián Álvarez",
    team: "ARG",
    role: "FWD",
    credits: 8.5,
    form: "7.1",
    points: 61,
  },
  {
    id: 15,
    name: "Mohamed Salah",
    team: "EGY",
    role: "FWD",
    credits: 10,
    form: "8.2",
    points: 91,
  },
  {
    id: 16,
    name: "Mostafa Mohamed",
    team: "EGY",
    role: "FWD",
    credits: 8,
    form: "7.0",
    points: 54,
  },
];

function TeamBadge({
  team,
  small = false,
}: {
  team: "ARG" | "EGY";
  small?: boolean;
}) {
  return (
    <span
      className={`team-badge team-badge--${team.toLowerCase()} ${small ? "is-small" : ""}`}
      aria-label={team === "ARG" ? "Argentina" : "Egypt"}
    >
      {team === "ARG" ? "A" : "E"}
    </span>
  );
}

function LivePill({ minute = 63 }: { minute?: number }) {
  return (
    <span className="live-pill">
      <i /> REPLAY · {minute}:00
    </span>
  );
}

export function Dashboard() {
  const [screen, setScreen] = useState<Screen>("home");
  const [stake, setStake] = useState(2);
  const [balance, setBalance] = useState(18.4);
  const [card, setCard] = useState(0);
  const [streak, setStreak] = useState(6);
  const [points, setPoints] = useState(1240);
  const [toast, setToast] = useState("");
  const [roomOpen, setRoomOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [customRooms, setCustomRooms] = useState<string[]>([]);
  const [txCursor, setTxCursor] = useState(6);
  const [txFrame, setTxFrame] = useState<WorldCupTxLineFrame | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/world-cup/txline?cursor=${txCursor}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((body: { frame?: WorldCupTxLineFrame }) => {
        if (body.frame) setTxFrame(body.frame);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [txCursor]);

  function navigate(next: Screen) {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }
  function handleJoin() {
    setBalance((v) => v - stake);
    setScreen("play");
    showToast(`You’re in · $${stake} active`);
  }
  function handlePick(pick: Pick) {
    if (pick !== "SKIP") {
      setPoints((v) => v + (card === 0 ? 80 : 40));
      setStreak((v) => v + 1);
      setResolved(card === 0);
      showToast(`${pick} locked · +${card === 0 ? 80 : 40} pts`);
    } else showToast("Skipped · no points lost");
    setCard((v) => (v + 1) % predictions.length);
    setTxCursor((cursor) => (cursor + 1) % (txFrame?.totalFrames ?? 11));
  }

  return (
    <div className="fan-app">
      <header className="fan-header">
        <button
          className="fan-logo"
          onClick={() => navigate("home")}
          aria-label="Go home"
        >
          <span>c</span>copium<em>.fun</em>
        </button>
        <nav aria-label="Main navigation">
          <button
            className={screen === "home" ? "active" : ""}
            onClick={() => navigate("home")}
          >
            <House />
            Home
          </button>
          <button
            className={screen === "fantasy" ? "active" : ""}
            onClick={() => navigate("fantasy")}
          >
            <Shirt />
            Fantasy
          </button>
          <button
            className={screen === "rooms" ? "active" : ""}
            onClick={() => navigate("rooms")}
          >
            <Users />
            Rooms
          </button>
          <button
            className={screen === "leaders" ? "active" : ""}
            onClick={() => navigate("leaders")}
          >
            <Trophy />
            Leaders
          </button>
        </nav>
        <div className="fan-header__right">
          <button className="icon-button" aria-label="Notifications">
            <Bell />
            <i />
          </button>
          <button className="balance-button" onClick={() => navigate("wallet")}>
            <WalletCards />
            <span>
              <small>Balance</small>${balance.toFixed(2)}
            </span>
          </button>
          <button
            className="avatar-button"
            onClick={() => navigate("profile")}
            aria-label="Open profile"
          >
            AK
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.main
          key={screen}
          className="fan-main"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
          {screen === "home" && (
            <Home
              onOpen={() => navigate("lobby")}
              onRooms={() => navigate("rooms")}
              streak={streak}
              frame={txFrame}
            />
          )}
          {screen === "lobby" && (
            <Lobby
              stake={stake}
              setStake={setStake}
              balance={balance}
              onBack={() => navigate("home")}
              onJoin={handleJoin}
              frame={txFrame}
            />
          )}
          {screen === "play" && (
            <Play
              card={card}
              stake={stake}
              setStake={setStake}
              streak={streak}
              points={points}
              onPick={handlePick}
              onClose={() => navigate("home")}
              onLeaders={() => navigate("leaders")}
              resolved={resolved}
              frame={txFrame}
            />
          )}
          {screen === "fantasy" && (
            <FantasyTeam showToast={showToast} frame={txFrame} />
          )}
          {screen === "rooms" && (
            <Rooms
              onCreate={() => setRoomOpen(true)}
              customRooms={customRooms}
            />
          )}
          {screen === "leaders" && <Leaders points={points} />}
          {screen === "wallet" && (
            <Wallet balance={balance} onTopup={() => setTopupOpen(true)} />
          )}
          {screen === "profile" && <Profile />}
        </motion.main>
      </AnimatePresence>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button
          className={screen === "home" ? "active" : ""}
          onClick={() => navigate("home")}
        >
          <House />
          Home
        </button>
        <button
          className={screen === "fantasy" ? "active" : ""}
          onClick={() => navigate("fantasy")}
        >
          <Shirt />
          Fantasy
        </button>
        <button
          className={screen === "leaders" ? "active" : ""}
          onClick={() => navigate("leaders")}
        >
          <Trophy />
          Leaders
        </button>
        <button
          className={screen === "wallet" ? "active" : ""}
          onClick={() => navigate("wallet")}
        >
          <WalletCards />
          Balance
        </button>
      </nav>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            className="fan-toast"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Check />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {roomOpen && (
          <RoomSheet
            onClose={() => setRoomOpen(false)}
            onDone={(name) => {
              setCustomRooms((rooms) => [name, ...rooms]);
              setRoomOpen(false);
              showToast(`${name} created · invite ready`);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {topupOpen && (
          <TopupSheet
            onClose={() => setTopupOpen(false)}
            onDone={(amount) => {
              setBalance((v) => v + amount);
              setTopupOpen(false);
              showToast(`$${amount} added to your balance`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Home({
  onOpen,
  onRooms,
  streak,
  frame,
}: {
  onOpen: () => void;
  onRooms: () => void;
  streak: number;
  frame: WorldCupTxLineFrame | null;
}) {
  return (
    <div className="home-screen">
      <section className="welcome-row">
        <div>
          <span className="eyebrow">WORLD CUP 2026 · REPLAY MODE</span>
          <h1>
            Every moment
            <br />
            is <em>in play.</em>
          </h1>
          <p>Pick what happens next. Climb the table. Win with your friends.</p>
        </div>
        <div className="streak-chip">
          <Flame />
          <span>
            <strong>{streak}</strong> pick streak
            <small>1 more unlocks a 1.2× boost</small>
          </span>
          <div className="mini-progress">
            <i style={{ width: "86%" }} />
          </div>
        </div>
      </section>
      <section
        className="hero-match"
        onClick={onOpen}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
        aria-label="Open Argentina versus Egypt"
      >
        <div className="stadium-light stadium-light--one" />
        <div className="stadium-light stadium-light--two" />
        <div className="hero-match__top">
          <LivePill minute={frame?.context.minute} />
          <span>
            <Users /> 4,280 playing now
          </span>
        </div>
        <div className="hero-match__body">
          <div className="club-side">
            <TeamBadge team="ARG" />
            <div>
              <strong>{frame?.fixture.home.name ?? "Argentina"}</strong>
              <small>HOME</small>
            </div>
          </div>
          <div className="score">
            <small>{frame?.fixture.stage ?? "WORLD CUP · ROUND OF 16"}</small>
            <strong>
              {frame?.context.scoreHome ?? 0} <i>—</i>{" "}
              {frame?.context.scoreAway ?? 2}
            </strong>
            <span>{frame?.context.minute ?? 63}:00</span>
          </div>
          <div className="club-side club-side--away">
            <div>
              <strong>{frame?.fixture.away.name ?? "Egypt"}</strong>
              <small>AWAY</small>
            </div>
            <TeamBadge team="EGY" />
          </div>
        </div>
        <div className="hero-match__bottom">
          <div>
            <small>WORLD CUP PRIZE</small>
            <strong>$12,840</strong>
          </div>
          <div className="friend-stack">
            <span>RK</span>
            <span>DV</span>
            <span>SM</span>
            <p>
              <b>3 friends</b> are already in
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            Play from $1 <ArrowRight />
          </button>
        </div>
      </section>
      <section className="section-head">
        <div>
          <span className="eyebrow">HAPPENING NOW</span>
          <h2>More World Cup matches</h2>
        </div>
        <button>
          See all <ChevronRight />
        </button>
      </section>
      <div className="match-grid">
        <WorldCupMatchCard
          home="Brazil"
          away="Norway"
          homeCode="🇧🇷"
          awayCode="🇳🇴"
          homeScore="1"
          awayScore="2"
          date="Mon, 6 Jul"
        />
        <WorldCupMatchCard
          home="Mexico"
          away="England"
          homeCode="🇲🇽"
          awayCode="🏴"
          homeScore="2"
          awayScore="3"
          date="Mon, 6 Jul"
        />
        <WorldCupMatchCard
          home="Portugal"
          away="Spain"
          homeCode="🇵🇹"
          awayCode="🇪🇸"
          homeScore="0"
          awayScore="1"
          date="Tue, 7 Jul"
        />
        <WorldCupMatchCard
          home="USA"
          away="Belgium"
          homeCode="🇺🇸"
          awayCode="🇧🇪"
          homeScore="1"
          awayScore="4"
          date="Tue, 7 Jul"
        />
        <WorldCupMatchCard
          home="Argentina"
          away="Egypt"
          homeCode="🇦🇷"
          awayCode="🇪🇬"
          homeScore={String(frame?.context.scoreHome ?? 0)}
          awayScore={String(frame?.context.scoreAway ?? 2)}
          date={
            frame?.scoreUpdate.GameState === "F"
              ? "Tue, 7 Jul"
              : `Tue, 7 Jul · ${frame?.context.minute ?? 74}′`
          }
          status={
            frame?.scoreUpdate.GameState === "F"
              ? "FT"
              : `LIVE · ${frame?.context.minute ?? 74}′`
          }
          selected
          onOpen={onOpen}
        />
        <WorldCupMatchCard
          home="Switzerland"
          away="Colombia"
          homeCode="🇨🇭"
          awayCode="🇨🇴"
          homeScore="0 (4)"
          awayScore="0 (3)"
          date="Wed, 8 Jul"
          status="FT (P)"
        />
        <button className="room-callout" onClick={onRooms}>
          <div>
            <Users />
            <Plus />
          </div>
          <span>PRIVATE ROOMS</span>
          <h3>
            Play the match
            <br />
            with your people.
          </h3>
          <p>Invite friends, set the entry, own the leaderboard.</p>
        </button>
      </div>
      <section className="rivalry-slice">
        <div>
          <span className="eyebrow">SUPPORTER SHOWDOWN</span>
          <h2>The crowd has picked sides.</h2>
          <p>Your predictions count for you—and everyone in your colours.</p>
        </div>
        <div className="rivalry-score">
          <div>
            <TeamBadge team="ARG" small />
            <span>
              <strong>Argentina</strong>
              <small>12.8K supporters</small>
            </span>
          </div>
          <strong>
            54<small>%</small>
          </strong>
          <div className="rivalry-track">
            <i />
          </div>
          <strong>
            46<small>%</small>
          </strong>
          <div>
            <TeamBadge team="EGY" small />
            <span>
              <strong>Egypt</strong>
              <small>11.3K supporters</small>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function WorldCupMatchCard({
  home,
  away,
  homeCode,
  awayCode,
  homeScore,
  awayScore,
  date,
  status = "FT",
  selected = false,
  onOpen,
}: {
  home: string;
  away: string;
  homeCode: string;
  awayCode: string;
  homeScore: string;
  awayScore: string;
  date: string;
  status?: string;
  selected?: boolean;
  onOpen?: () => void;
}) {
  return (
    <button
      className={`wc-match-card ${selected ? "is-selected" : ""}`}
      onClick={onOpen}
    >
      <header>
        <span>ROUND OF 16</span>
        <strong>{status}</strong>
      </header>
      <div className="wc-match-card__date">{date}</div>
      <div className="wc-match-card__team">
        <span>{homeCode}</span>
        <b>{home}</b>
        <strong>{homeScore}</strong>
      </div>
      <div className="wc-match-card__team">
        <span>{awayCode}</span>
        <b>{away}</b>
        <strong>{awayScore}</strong>
      </div>
      {selected && (
        <small className="wc-match-card__cta">
          Open prediction room <ArrowRight />
        </small>
      )}
    </button>
  );
}

function MiniMatch({
  teams,
  score,
  minute,
  players,
  color,
}: {
  teams: string;
  score: string;
  minute: string;
  players: string;
  color: string;
}) {
  return (
    <button className={`mini-match mini-match--${color}`}>
      <div>
        <LivePill />
        <span>{players} playing</span>
      </div>
      <p>{teams}</p>
      <strong>{score}</strong>
      <footer>
        <span>{minute}</span>
        <b>
          Open match <ArrowRight />
        </b>
      </footer>
    </button>
  );
}

function Lobby({
  stake,
  setStake,
  balance,
  onBack,
  onJoin,
  frame,
}: {
  stake: number;
  setStake: (v: number) => void;
  balance: number;
  onBack: () => void;
  onJoin: () => void;
  frame: WorldCupTxLineFrame | null;
}) {
  return (
    <div className="lobby-screen">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft /> All matches
      </button>
      <section className="lobby-banner">
        <div className="lobby-banner__top">
          <LivePill minute={frame?.context.minute} />
          <span>WORLD CUP 2026 · {frame?.fixture.stage ?? "ROUND OF 16"}</span>
        </div>
        <div className="lobby-teams">
          <div>
            <TeamBadge team="ARG" />
            <strong>{frame?.fixture.home.name ?? "Argentina"}</strong>
          </div>
          <span>
            <strong>
              {frame?.context.scoreHome ?? 0} — {frame?.context.scoreAway ?? 2}
            </strong>
            <small>{frame?.context.minute ?? 63}:00</small>
          </span>
          <div>
            <TeamBadge team="EGY" />
            <strong>{frame?.fixture.away.name ?? "Egypt"}</strong>
          </div>
        </div>
        <div className="match-ticker">
          <span>
            <b>15′</b> GOAL · Y. Ibrahim
          </span>
          <span>
            <b>67′</b> GOAL · Mostafa Zico
          </span>
          <span>
            <b>{frame?.context.minute ?? 63}′</b>{" "}
            {frame?.context.lastEvent ?? "Argentina pressure"}
          </span>
        </div>
      </section>
      <div className="lobby-grid">
        <section className="join-panel">
          <span className="eyebrow">CHOOSE YOUR ENTRY</span>
          <h1>
            You’re one tap
            <br />
            from the action.
          </h1>
          <div className="stake-options">
            {[1, 2, 5].map((v) => (
              <button
                key={v}
                className={stake === v ? "active" : ""}
                onClick={() => setStake(v)}
              >
                ${v}
              </button>
            ))}
            <button
              className={![1, 2, 5].includes(stake) ? "active" : ""}
              onClick={() => setStake(10)}
            >
              Custom
            </button>
          </div>
          <div className="reward-box">
            <span>
              Play with <strong>${stake}</strong>
            </span>
            <span>
              Potential win <strong>${(stake * 4.2).toFixed(2)}</strong>
            </span>
          </div>
          <button className="primary-action" onClick={onJoin}>
            Join match · ${stake} <ArrowRight />
          </button>
          <p className="safe-copy">
            <ShieldCheck /> Your available balance after entry: $
            {(balance - stake).toFixed(2)}
          </p>
        </section>
        <aside className="competition-card">
          <div>
            <span className="eyebrow">MAIN COMPETITION</span>
            <Trophy />
          </div>
          <h2>$12,840</h2>
          <p>Live prize pool</p>
          <dl>
            <div>
              <dt>Players</dt>
              <dd>4,280</dd>
            </div>
            <div>
              <dt>Top prize</dt>
              <dd>$420</dd>
            </div>
            <div>
              <dt>Paid places</dt>
              <dd>Top 20%</dd>
            </div>
          </dl>
          <div className="friends-in">
            <span>RK</span>
            <span>DV</span>
            <span>SM</span>
            <p>
              <strong>Riya, Dev & Sam</strong>
              <br />
              are playing this match
            </p>
          </div>
          <div className="how-score">
            <b>How scoring works</b>
            <p>
              Correct picks earn points. Be quick, build streaks, and climb into
              a prize spot.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Play({
  card,
  stake,
  setStake,
  streak,
  points,
  onPick,
  onClose,
  onLeaders,
  resolved,
  frame,
}: {
  card: number;
  stake: number;
  setStake: (value: number) => void;
  streak: number;
  points: number;
  onPick: (p: Pick) => void;
  onClose: () => void;
  onLeaders: () => void;
  resolved: boolean;
  frame: WorldCupTxLineFrame | null;
}) {
  const x = useMotionValue(0),
    y = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-11, 11]);
  const yes = useTransform(x, [-120, -30], [1, 0]);
  const no = useTransform(x, [30, 120], [0, 1]);
  const skip = useTransform(y, [-120, -30], [1, 0]);
  const reduce = useReducedMotion();
  const basePrediction = predictions[card]!;
  const p = frame
    ? {
        ...basePrediction,
        question: frame.context.nextQuestion,
        context: frame.context.trend,
        stat: `${frame.context.crowdYesPct}%`,
        multiplier: `${frame.context.payout.toFixed(1)}×`,
        player: frame.scoreUpdate.Action?.Player ?? "World Cup match event",
      }
    : basePrediction;
  function end(_: unknown, info: { offset: { x: number; y: number } }) {
    if (info.offset.y < -80) onPick("SKIP");
    else if (info.offset.x < -90) onPick("YES");
    else if (info.offset.x > 90) onPick("NO");
  }
  return (
    <div className="play-screen">
      <div className="play-top">
        <button onClick={onClose} aria-label="Close predictions">
          <X />
        </button>
        <div>
          <TeamBadge team="ARG" small />
          <span>
            <b>
              {frame?.fixture.home.name ?? "Argentina"}{" "}
              {frame?.context.scoreHome ?? 0} — {frame?.context.scoreAway ?? 2}{" "}
              {frame?.fixture.away.name ?? "Egypt"}
            </b>
            <small>
              TXLINE-SHAPED REPLAY · UNVERIFIED · {frame?.context.minute ?? 63}
              :00 · SEQ {frame?.scoreUpdate.Seq ?? 7}
            </small>
          </span>
          <TeamBadge team="EGY" small />
        </div>
        <button onClick={onLeaders}>
          <Leaderboard />
          <span>#{resolved ? 17 : 18}</span>
        </button>
      </div>
      <div className="play-layout">
        <aside className="play-stats">
          <span className="eyebrow">YOUR MATCH</span>
          <strong>#{resolved ? 17 : 18}</strong>
          <p>of 4,280 players</p>
          <dl>
            <div>
              <dt>Points</dt>
              <dd>{points.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Accuracy</dt>
              <dd>74%</dd>
            </div>
            <div>
              <dt>Winnings</dt>
              <dd>${resolved ? "9.20" : "8.40"}</dd>
            </div>
          </dl>
          <div className="tier">
            <span>
              <b>Prize zone</b>
              <small>140 pts away</small>
            </span>
            <i>
              <b style={{ width: resolved ? "82%" : "68%" }} />
            </i>
          </div>
        </aside>
        <section className="swipe-zone">
          <div className="gesture-legend">
            <span>
              ← <b>YES</b>
            </span>
            <span>↑ SKIP</span>
            <span>
              <b>NO</b> →
            </span>
          </div>
          <div className="card-deck">
            <div className="prediction-card prediction-card--behind" />
            <AnimatePresence mode="popLayout">
              <motion.article
                key={card}
                className="prediction-card"
                style={{ x, y, rotate }}
                drag={reduce ? false : true}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.7}
                onDragEnd={end}
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                whileTap={{ cursor: "grabbing" }}
              >
                <motion.span
                  style={{ opacity: yes }}
                  className="drag-stamp drag-stamp--yes"
                >
                  YES
                </motion.span>
                <motion.span
                  style={{ opacity: no }}
                  className="drag-stamp drag-stamp--no"
                >
                  NO
                </motion.span>
                <motion.span
                  style={{ opacity: skip }}
                  className="drag-stamp drag-stamp--skip"
                >
                  SKIP
                </motion.span>
                <header>
                  <span>{p.category}</span>
                  <span>
                    <Clock3 /> {p.time}
                  </span>
                </header>
                <div className="player-tag">
                  <span>MS</span>
                  {p.player}
                </div>
                <h1>{p.question}</h1>
                <div className="context-line">
                  <Sparkles />
                  <p>{p.context}</p>
                </div>
                <footer>
                  <div>
                    <small>CROWD SAYS YES</small>
                    <strong>{p.stat}</strong>
                  </div>
                  <div>
                    <small>YOUR PAYOUT</small>
                    <strong>{p.multiplier}</strong>
                  </div>
                  <span>Playing ${stake}</span>
                </footer>
              </motion.article>
            </AnimatePresence>
          </div>
          <div className="card-stakes" aria-label="Prediction amount">
            <span>PLAYING FOR</span>
            {[1, 5, 10].map((amount) => (
              <button
                key={amount}
                className={stake === amount ? "active" : ""}
                onClick={() => setStake(amount)}
              >
                ${amount}
              </button>
            ))}
          </div>
          <div className="pick-buttons">
            <button className="yes" onClick={() => onPick("YES")}>
              <ArrowLeft /> Yes
            </button>
            <button className="skip" onClick={() => onPick("SKIP")}>
              <ArrowDown /> Skip
            </button>
            <button className="no" onClick={() => onPick("NO")}>
              No <ArrowRight />
            </button>
          </div>
          <p className="drag-help">
            Drag the card or use the buttons · your choice locks instantly
          </p>
        </section>
        <aside className="streak-panel">
          <Flame />
          <span>
            <strong>{streak}</strong> in a row
          </span>
          <p>
            You’re on fire. One more correct pick unlocks a 1.2× points boost.
          </p>
          <div>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <i className={n <= Math.min(streak, 7) ? "done" : ""} key={n}>
                {n < 7 ? <Check /> : <Crown />}
              </i>
            ))}
          </div>
          <small>
            Next: <b>Hot hand boost</b>
          </small>
        </aside>
      </div>
    </div>
  );
}

function FantasyTeam({
  showToast,
  frame,
}: {
  showToast: (message: string) => void;
  frame: WorldCupTxLineFrame | null;
}) {
  const [selected, setSelected] = useState<number[]>([
    1, 3, 4, 6, 7, 8, 10, 11,
  ]);
  const [role, setRole] = useState<"ALL" | FantasyPlayer["role"]>("ALL");
  const [stage, setStage] = useState<"select" | "leaders" | "live">("select");
  const [captain, setCaptain] = useState<number | null>(null);
  const [vice, setVice] = useState<number | null>(null);
  const chosen = fantasyPlayers.filter((player) =>
    selected.includes(player.id)
  );
  const creditsUsed = chosen.reduce((sum, player) => sum + player.credits, 0);
  const counts = chosen.reduce<Record<string, number>>(
    (result, player) => ({
      ...result,
      [player.role]: (result[player.role] || 0) + 1,
    }),
    {}
  );
  const validTeam =
    selected.length === 11 &&
    (counts.GK || 0) >= 1 &&
    (counts.DEF || 0) >= 3 &&
    (counts.MID || 0) >= 3 &&
    (counts.FWD || 0) >= 1;
  const score = chosen.reduce(
    (sum, player) =>
      sum +
      player.points *
        (player.id === captain ? 2 : player.id === vice ? 1.5 : 1),
    0
  );

  function togglePlayer(player: FantasyPlayer) {
    if (selected.includes(player.id)) {
      setSelected((current) => current.filter((id) => id !== player.id));
      if (captain === player.id) setCaptain(null);
      if (vice === player.id) setVice(null);
      return;
    }
    if (selected.length >= 11)
      return showToast("Your XI is full · remove a player first");
    if (creditsUsed + player.credits > 100)
      return showToast("Not enough credits for this player");
    const fromTeam = chosen.filter((item) => item.team === player.team).length;
    if (fromTeam >= 7)
      return showToast(`Maximum 7 players from ${player.team}`);
    setSelected((current) => [...current, player.id]);
  }

  if (stage === "live")
    return (
      <div className="standard-screen fantasy-live">
        <div className="fantasy-live__head">
          <div>
            <span className="eyebrow">
              WORLD CUP FANTASY · TXLINE-SHAPED REPLAY · UNVERIFIED ·{" "}
              {frame?.context.minute ?? 63}:00
            </span>
            <h1>Your XI is scoring.</h1>
            <p>
              Argentina {frame?.context.scoreHome ?? 0} —{" "}
              {frame?.context.scoreAway ?? 2} Egypt · Round of 16
            </p>
          </div>
          <div>
            <small>LIVE RANK</small>
            <strong>#84</strong>
            <span>↑ 16</span>
          </div>
        </div>
        <div className="fantasy-live__grid">
          <section className="fantasy-pitch">
            <div className="pitch-circle" />
            {["GK", "DEF", "MID", "FWD"].map((line) => (
              <div
                className={`pitch-line pitch-line--${line.toLowerCase()}`}
                key={line}
              >
                {chosen
                  .filter((player) => player.role === line)
                  .map((player) => (
                    <div className="pitch-player" key={player.id}>
                      <span
                        className={`pitch-shirt pitch-shirt--${player.team.toLowerCase()}`}
                      >
                        {player.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <b>{player.name}</b>
                      <small>
                        {player.points}
                        {player.id === captain
                          ? " · C 2×"
                          : player.id === vice
                            ? " · VC 1.5×"
                            : " pts"}
                      </small>
                    </div>
                  ))}
              </div>
            ))}
          </section>
          <aside className="fantasy-scorecard">
            <span>TOTAL POINTS</span>
            <strong>{score}</strong>
            <p>Top 20% currently win $18.40</p>
            <div>
              <span>
                <small>Captain bonus</small>
                <b>
                  +{fantasyPlayers.find((p) => p.id === captain)?.points || 0}
                </b>
              </span>
              <span>
                <small>Players in action</small>
                <b>7 / 11</b>
              </span>
              <span>
                <small>Contest prize</small>
                <b>$20K</b>
              </span>
            </div>
            <button onClick={() => setStage("leaders")}>
              <ArrowLeft /> View lineup
            </button>
          </aside>
        </div>
      </div>
    );

  if (stage === "leaders")
    return (
      <div className="standard-screen fantasy-review">
        <button className="back-link" onClick={() => setStage("select")}>
          <ArrowLeft /> Edit team
        </button>
        <div className="fantasy-title">
          <div>
            <span className="eyebrow">CAPTAIN & VICE-CAPTAIN</span>
            <h1>Choose your leaders.</h1>
            <p>Captain scores 2× points. Vice-captain scores 1.5×.</p>
          </div>
          <div className="selection-meter">
            <strong>
              {captain && vice
                ? "Ready"
                : `${Number(Boolean(captain)) + Number(Boolean(vice))}/2`}
            </strong>
            <small>LEADERS PICKED</small>
          </div>
        </div>
        <div className="captain-grid">
          {chosen.map((player) => (
            <article
              className={
                captain === player.id || vice === player.id ? "is-leader" : ""
              }
              key={player.id}
            >
              <span
                className={`fantasy-avatar fantasy-avatar--${player.team.toLowerCase()}`}
              >
                {player.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <strong>{player.name}</strong>
                <small>
                  {player.role} · {player.team} · {player.points} pts
                </small>
              </div>
              <button
                className={captain === player.id ? "active" : ""}
                onClick={() => {
                  setCaptain(player.id);
                  if (vice === player.id) setVice(null);
                }}
              >
                C
              </button>
              <button
                className={vice === player.id ? "active" : ""}
                onClick={() => {
                  setVice(player.id);
                  if (captain === player.id) setCaptain(null);
                }}
              >
                VC
              </button>
            </article>
          ))}
        </div>
        <div className="fantasy-checkout">
          <div>
            <span>
              <small>CONTEST</small>
              <b>Sunday Main Event</b>
            </span>
            <span>
              <small>ENTRY</small>
              <b>$5</b>
            </span>
            <span>
              <small>PRIZE POOL</small>
              <b>$20,000</b>
            </span>
          </div>
          <button
            className="primary-action"
            disabled={!captain || !vice}
            onClick={() => {
              setStage("live");
              showToast("Team entered · contest is live");
            }}
          >
            Enter contest · $5 <ArrowRight />
          </button>
        </div>
      </div>
    );

  return (
    <div className="standard-screen fantasy-builder">
      <div className="fantasy-title">
        <div>
          <span className="eyebrow">
            WORLD CUP FANTASY · ARG vs EGY · ROUND OF 16
          </span>
          <h1>Build your XI.</h1>
          <p>Choose 11 players. Maximum 7 from one club.</p>
        </div>
        <div className="fantasy-budget">
          <span>
            <small>PLAYERS</small>
            <strong>
              {selected.length}
              <i>/11</i>
            </strong>
          </span>
          <span>
            <small>CREDITS LEFT</small>
            <strong>{(100 - creditsUsed).toFixed(1)}</strong>
          </span>
        </div>
      </div>
      <div className="squad-rule">
        <span className={(counts.GK || 0) >= 1 ? "done" : ""}>
          GK {counts.GK || 0}/1+
        </span>
        <span className={(counts.DEF || 0) >= 3 ? "done" : ""}>
          DEF {counts.DEF || 0}/3+
        </span>
        <span className={(counts.MID || 0) >= 3 ? "done" : ""}>
          MID {counts.MID || 0}/3+
        </span>
        <span className={(counts.FWD || 0) >= 1 ? "done" : ""}>
          FWD {counts.FWD || 0}/1+
        </span>
      </div>
      <div className="fantasy-tabs">
        {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((item) => (
          <button
            className={role === item ? "active" : ""}
            onClick={() => setRole(item)}
            key={item}
          >
            {item === "ALL" ? "All players" : item}
          </button>
        ))}
      </div>
      <section className="player-table">
        <header>
          <span>Player</span>
          <span>Form</span>
          <span>Credits</span>
          <span>Select</span>
        </header>
        {fantasyPlayers
          .filter((player) => role === "ALL" || player.role === role)
          .map((player) => {
            const picked = selected.includes(player.id);
            return (
              <button
                className={picked ? "selected" : ""}
                onClick={() => togglePlayer(player)}
                key={player.id}
              >
                <span className="fantasy-person">
                  <i
                    className={`fantasy-avatar fantasy-avatar--${player.team.toLowerCase()}`}
                  >
                    {player.name.slice(0, 2).toUpperCase()}
                  </i>
                  <b>
                    {player.name}
                    <small>
                      {player.team} · {player.role}
                    </small>
                  </b>
                </span>
                <span>{player.form}</span>
                <span>{player.credits}</span>
                <span className="add-player">
                  {picked ? <Check /> : <Plus />}
                </span>
              </button>
            );
          })}
      </section>
      <div className="fantasy-dock">
        <div className="mini-lineup">
          {chosen.map((player) => (
            <span
              className={`fantasy-avatar fantasy-avatar--${player.team.toLowerCase()}`}
              key={player.id}
            >
              {player.name.slice(0, 2).toUpperCase()}
            </span>
          ))}
          {Array.from({ length: 11 - selected.length }).map((_, index) => (
            <i key={index} />
          ))}
        </div>
        <button
          className="primary-action"
          disabled={!validTeam}
          onClick={() => setStage("leaders")}
        >
          Choose captain <ArrowRight />
        </button>
      </div>
    </div>
  );
}

function Rooms({
  onCreate,
  customRooms,
}: {
  onCreate: () => void;
  customRooms: string[];
}) {
  return (
    <div className="standard-screen">
      <div className="page-title">
        <div>
          <span className="eyebrow">PLAY TOGETHER</span>
          <h1>Your rooms</h1>
          <p>
            Private leaderboards, shared stakes, unmatched group-chat energy.
          </p>
        </div>
        <button className="primary-action" onClick={onCreate}>
          <Plus /> Create room
        </button>
      </div>
      <div className="room-grid">
        {customRooms.map((name) => (
          <motion.article
            className="private-room private-room--new"
            key={name}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
          >
            <header>
              <span>
                <LockKeyhole /> PRIVATE · 1/10
              </span>
              <b>JUST CREATED</b>
            </header>
            <h2>{name}</h2>
            <p>Argentina vs Egypt · World Cup Round of 16</p>
            <div className="room-pot">
              <span>
                <small>PRIZE POOL</small>
                <strong>$10</strong>
              </span>
              <span>
                <small>ENTRY</small>
                <strong>$2</strong>
              </span>
              <span>
                <small>STATUS</small>
                <strong>Open</strong>
              </span>
            </div>
            <div className="room-members">
              <span>YO</span>
            </div>
            <button className="room-enter">
              Copy invite <Copy />
            </button>
          </motion.article>
        ))}
        <article className="private-room">
          <header>
            <span>
              <LockKeyhole /> PRIVATE · 8/10
            </span>
            <button>•••</button>
          </header>
          <h2>
            Saturday Night
            <br />
            Degens
          </h2>
          <p>Argentina vs Netherlands · World Cup</p>
          <div className="room-pot">
            <span>
              <small>PRIZE POOL</small>
              <strong>$40</strong>
            </span>
            <span>
              <small>ENTRY</small>
              <strong>$5</strong>
            </span>
            <span>
              <small>STARTS</small>
              <strong>28m</strong>
            </span>
          </div>
          <div className="room-members">
            {["RI", "SA", "DV", "NK", "+4"].map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <button className="room-enter">
            Open room <ArrowRight />
          </button>
        </article>
        <article className="activity-card">
          <span className="eyebrow">ROOM ACTIVITY</span>
          <h2>It’s getting competitive.</h2>
          {[
            ["RI", "Riya moved to first place.", "now"],
            ["SA", "Sam called the next corner.", "2m"],
            ["DV", "Dev lost a 6-pick streak.", "4m"],
          ].map((x) => (
            <div className="activity-row" key={x[1]}>
              <span>{x[0]}</span>
              <p>
                {x[1]}
                <small>{x[2]}</small>
              </p>
            </div>
          ))}
          <button>
            View Saturday Night Degens <ChevronRight />
          </button>
        </article>
        <button className="join-room">
          <Plus />
          <h3>Have an invite code?</h3>
          <p>Join your friends in seconds.</p>
          <span>
            Enter code <ArrowRight />
          </span>
        </button>
      </div>
    </div>
  );
}

function Leaders({ points }: { points: number }) {
  const rows = useMemo(
    () =>
      people.map((r) =>
        r[1] === "You"
          ? ["17", "You", points.toLocaleString(), "74%", "7", "$9.20", "YO"]
          : r
      ),
    [points]
  );
  return (
    <div className="standard-screen">
      <div className="page-title">
        <div>
          <span className="eyebrow">WORLD CUP COMPETITION</span>
          <h1>Leaderboard</h1>
          <p>
            Argentina 3 — 2 Egypt · Round of 16 · TxLINE-shaped local replay
          </p>
        </div>
        <div className="rank-card">
          <span>YOUR RANK</span>
          <strong>#17</strong>
          <small>↑ 1 place</small>
        </div>
      </div>
      <div className="leader-tabs">
        {["Match", "Friends", "Weekly", "Supporters", "Rooms"].map((x, i) => (
          <button className={i === 0 ? "active" : ""} key={x}>
            {x}
          </button>
        ))}
      </div>
      <section className="leader-board">
        <header>
          <span>Rank · player</span>
          <span>Points</span>
          <span>Accuracy</span>
          <span>Streak</span>
          <span>Winnings</span>
        </header>
        {rows.map((r) => (
          <div
            className={`leader-row ${r[1] === "You" ? "is-you" : ""}`}
            key={r[1]}
          >
            <span className="leader-person">
              <b>{r[0]}</b>
              <i>{r[6]}</i>
              <strong>{r[1]}</strong>
              {r[1] === "You" && <small>YOU</small>}
            </span>
            <span>{r[2]}</span>
            <span>{r[3]}</span>
            <span>
              <Flame />
              {r[4]}
            </span>
            <span>{r[5]}</span>
          </div>
        ))}
      </section>
      <section className="supporter-board">
        <div>
          <span className="eyebrow">TEAM RIVALRY</span>
          <h2>You’re playing for Argentina.</h2>
          <p>
            Your predictions have contributed <strong>320 points.</strong>
          </p>
        </div>
        <div className="supporter-meter">
          <span>
            <TeamBadge team="ARG" small />
            <b>Argentina</b>
            <strong>54%</strong>
          </span>
          <i>
            <b />
          </i>
          <span>
            <TeamBadge team="EGY" small />
            <b>Egypt</b>
            <strong>46%</strong>
          </span>
          <p>Argentina supporters lead by 8% · 24.1K playing</p>
        </div>
      </section>
    </div>
  );
}

function Wallet({
  balance,
  onTopup,
}: {
  balance: number;
  onTopup: () => void;
}) {
  return (
    <div className="standard-screen">
      <div className="page-title">
        <div>
          <span className="eyebrow">YOUR MONEY</span>
          <h1>Balance</h1>
          <p>Everything you need to play, win, and cash out.</p>
        </div>
      </div>
      <div className="wallet-grid">
        <section className="money-card">
          <span>AVAILABLE TO PLAY</span>
          <h2>${balance.toFixed(2)}</h2>
          <div>
            <button onClick={onTopup}>
              <Plus /> Add money
            </button>
            <button>Withdraw</button>
          </div>
          <footer>
            <span>
              <small>ACTIVE STAKES</small>
              <strong>$6.00</strong>
            </span>
            <span>
              <small>TOTAL WINNINGS</small>
              <strong>$84.20</strong>
            </span>
          </footer>
        </section>
        <section className="activity-list">
          <div>
            <span className="eyebrow">RECENT ACTIVITY</span>
            <button>View all</button>
          </div>
          {[
            ["Trophy", "Argentina vs Egypt", "Prediction winnings", "+$9.20"],
            ["Goal", "Argentina vs Netherlands", "Match entry", "−$5.00"],
            ["Plus", "Balance added", "Today, 6:40 PM", "+$10.00"],
            [
              "Trophy",
              "Mexico vs South Africa",
              "Prediction winnings",
              "+$4.80",
            ],
          ].map((x, i) => (
            <div key={x[1]}>
              <i>
                {i === 0 || i === 3 ? (
                  <Trophy />
                ) : i === 1 ? (
                  <Goal />
                ) : (
                  <Plus />
                )}
              </i>
              <span>
                <strong>{x[1]}</strong>
                <small>{x[2]}</small>
              </span>
              <b className={x[3].startsWith("+") ? "positive" : ""}>{x[3]}</b>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function Profile() {
  const [agent, setAgent] = useState(false);
  return (
    <div className="standard-screen">
      <div className="profile-head">
        <span>AK</span>
        <div>
          <h1>Arko Roy</h1>
          <p>@arkoplays · Argentina supporter</p>
        </div>
        <button>
          <Settings2 /> Edit profile
        </button>
      </div>
      <div className="profile-stats">
        <div>
          <small>PREDICTIONS</small>
          <strong>286</strong>
        </div>
        <div>
          <small>ACCURACY</small>
          <strong>74%</strong>
        </div>
        <div>
          <small>BEST STREAK</small>
          <strong>12</strong>
        </div>
        <div>
          <small>WINNINGS</small>
          <strong>$84.20</strong>
        </div>
      </div>
      <section className="achievements">
        <div>
          <span className="eyebrow">YOUR FORM</span>
          <h2>Keep the run alive.</h2>
        </div>
        <div className="achievement-grid">
          <article>
            <Flame />
            <strong>4 days</strong>
            <p>Come back tomorrow to protect your streak.</p>
          </article>
          <article>
            <Crown />
            <strong>Hot hand</strong>
            <p>Make 3 more correct picks to unlock this badge.</p>
          </article>
          <article>
            <Trophy />
            <strong>Top 20%</strong>
            <p>You’ve placed in the prize zone 7 times.</p>
          </article>
        </div>
      </section>
      <section className="integration-panel">
        <div>
          <span>
            <Bot />
          </span>
          <div>
            <small>INTEGRATIONS · OPTIONAL</small>
            <h2>Play with your AI agent</h2>
            <p>
              Connect an autonomous agent to participate in supported prediction
              markets with limits you control.
            </p>
          </div>
        </div>
        <button onClick={() => setAgent(!agent)}>
          {agent ? "Connected · paused" : "Set up agent"} <ChevronRight />
        </button>
        {agent && (
          <div className="agent-settings">
            <span>
              <b>Maximum pick</b>
              <small>$2.00</small>
            </span>
            <span>
              <b>Daily limit</b>
              <small>$10.00</small>
            </span>
            <span>
              <b>Status</b>
              <small>Paused</small>
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="sheet-backdrop"
      onMouseDown={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bottom-sheet"
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      >
        <header>
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close">
            <X />
          </button>
        </header>
        {children}
      </motion.section>
    </motion.div>
  );
}
function RoomSheet({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (name: string) => void;
}) {
  const [name, setName] = useState("Sunday football people");
  return (
    <Sheet title="Create a room" onClose={onClose}>
      <label>
        Room name
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        Match
        <button className="sheet-select">
          <span>
            Argentina vs Egypt<small>World Cup · replay available</small>
          </span>
          <ChevronRight />
        </button>
      </label>
      <div className="sheet-row">
        <label>
          Entry
          <select defaultValue="2">
            <option value="1">$1</option>
            <option value="2">$2</option>
            <option value="5">$5</option>
          </select>
        </label>
        <label>
          Max players
          <select defaultValue="10">
            <option>6</option>
            <option>10</option>
            <option>20</option>
          </select>
        </label>
      </div>
      <button
        className="primary-action"
        onClick={() => onDone(name.trim() || "Sunday football people")}
      >
        Create room <ArrowRight />
      </button>
    </Sheet>
  );
}
function TopupSheet({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (n: number) => void;
}) {
  const [amount, setAmount] = useState(10);
  return (
    <Sheet title="Add money" onClose={onClose}>
      <p className="sheet-copy">
        Choose an amount. It will be ready to play in seconds.
      </p>
      <div className="topup-options">
        {[5, 10, 25].map((n) => (
          <button
            className={n === amount ? "active" : ""}
            onClick={() => setAmount(n)}
            key={n}
          >
            ${n}
          </button>
        ))}
      </div>
      <div className="payment-source">
        <span>
          <CircleDollarSign />
          <b>Pay with connected account</b>
        </span>
        <Check />
      </div>
      <button className="primary-action" onClick={() => onDone(amount)}>
        Add ${amount} <ArrowRight />
      </button>
    </Sheet>
  );
}
