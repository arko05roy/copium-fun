export type TxLineScoreUpdate = {
  FixtureId: number;
  Seq: number;
  Ts: number;
  GameState: "NS" | "H1" | "HT" | "H2" | "F";
  Clock: { Seconds: number; Running: boolean };
  Stats: Record<string, { value: number }>;
  Action?: {
    Type: "kick_off" | "shot" | "goal" | "corner" | "free_kick" | "comment";
    Participant?: 1 | 2;
    Player?: string;
    Data?: Record<string, string | number | boolean>;
  };
};

export type TxLineOddsUpdate = {
  FixtureId: number;
  MessageId: string;
  Ts: number;
  SuperOddsType: string;
  Pct: string[];
  GameState: string;
};

export type WorldCupFixture = {
  fixtureId: number;
  competition: "World Cup 2026";
  stage: string;
  group: string;
  home: { name: string; code: string; badge?: string };
  away: { name: string; code: string; badge?: string };
  stadium: string;
  kickoff: string;
};

export type WorldCupTxLineFrame = {
  mode: "txline_compatible_replay";
  source: {
    eventSchema: "txline-soccer-feed-v1.1";
    fixtureMetadata: "openfootball-2026" | "bundled-fallback";
    teamMetadata: "thesportsdb" | "bundled-fallback";
    verification: "unverified-no-merkle-proof";
    fixtureUrl: string;
  };
  fixture: WorldCupFixture;
  cursor: number;
  totalFrames: number;
  scoreUpdate: TxLineScoreUpdate;
  oddsUpdate: TxLineOddsUpdate;
  context: {
    scoreHome: number;
    scoreAway: number;
    minute: number;
    phase: string;
    lastEvent: string;
    nextQuestion: string;
    trend: string;
    crowdYesPct: number;
    payout: number;
  };
};

type OpenFootballMatch = {
  round?: string;
  date?: string;
  time?: string;
  team1?: string;
  team2?: string;
  group?: string;
  ground?: string;
};

type SportsDbTeam = {
  strTeam?: string;
  strTeamShort?: string;
  strBadge?: string;
};

const FIXTURE_ID = 20_260_013;
const BASE_TS = Date.parse("2026-06-13T22:00:00Z");

const fallbackFixture: WorldCupFixture = {
  fixtureId: FIXTURE_ID,
  competition: "World Cup 2026",
  stage: "Group stage · Matchday 3",
  group: "Group C",
  home: { name: "Brazil", code: "BRA" },
  away: { name: "Morocco", code: "MAR" },
  stadium: "New York / New Jersey",
  kickoff: "2026-06-13T22:00:00Z",
};

const replay: Array<{
  minute: number;
  phase: TxLineScoreUpdate["GameState"];
  home: number;
  away: number;
  action: TxLineScoreUpdate["Action"];
  line: number;
  question: string;
  trend: string;
  crowd: number;
  payout: number;
}> = [
  {
    minute: 0,
    phase: "H1",
    home: 0,
    away: 0,
    action: { Type: "kick_off" },
    line: 56,
    question: "Will Brazil take the first shot?",
    trend: "Brazil start as 56% favourites",
    crowd: 64,
    payout: 1.7,
  },
  {
    minute: 9,
    phase: "H1",
    home: 0,
    away: 0,
    action: {
      Type: "shot",
      Participant: 1,
      Player: "Vinícius Júnior",
      Data: { Outcome: "Blocked" },
    },
    line: 58,
    question: "Will the next shot be on target?",
    trend: "Three attempts in the opening nine minutes",
    crowd: 61,
    payout: 1.9,
  },
  {
    minute: 21,
    phase: "H1",
    home: 0,
    away: 1,
    action: { Type: "goal", Participant: 2, Player: "Ismael Saibari" },
    line: 43,
    question: "Will Brazil equalise before halftime?",
    trend: "Morocco lead after Saibari’s 21st-minute goal",
    crowd: 72,
    payout: 2.1,
  },
  {
    minute: 27,
    phase: "H1",
    home: 0,
    away: 1,
    action: { Type: "corner", Participant: 1 },
    line: 47,
    question: "Will Brazil score from this spell of pressure?",
    trend: "Brazil have won two corners since conceding",
    crowd: 68,
    payout: 2.0,
  },
  {
    minute: 32,
    phase: "H1",
    home: 1,
    away: 1,
    action: { Type: "goal", Participant: 1, Player: "Vinícius Júnior" },
    line: 59,
    question: "Will Brazil score the next goal?",
    trend: "Vinícius has levelled the match at 1–1",
    crowd: 66,
    payout: 1.8,
  },
  {
    minute: 45,
    phase: "HT",
    home: 1,
    away: 1,
    action: { Type: "comment", Data: { Text: "Halftime" } },
    line: 55,
    question: "Will the match have a winner?",
    trend: "Level at halftime with eight total attempts",
    crowd: 74,
    payout: 1.9,
  },
  {
    minute: 63,
    phase: "H2",
    home: 1,
    away: 1,
    action: {
      Type: "shot",
      Participant: 1,
      Player: "Rodrygo",
      Data: { Outcome: "OnTarget" },
    },
    line: 61,
    question: "Will Brazil take the next shot?",
    trend: "Brazil have taken 3 of the last 4 shots",
    crowd: 74,
    payout: 1.8,
  },
  {
    minute: 68,
    phase: "H2",
    home: 1,
    away: 1,
    action: {
      Type: "free_kick",
      Participant: 2,
      Data: { FreeKickType: "Danger" },
    },
    line: 57,
    question: "Will Morocco’s next attempt be on target?",
    trend: "Morocco have a dangerous free kick",
    crowd: 48,
    payout: 2.4,
  },
  {
    minute: 74,
    phase: "H2",
    home: 1,
    away: 1,
    action: { Type: "corner", Participant: 2 },
    line: 53,
    question: "Will the next goal arrive before 80:00?",
    trend: "The momentum has swung toward Morocco",
    crowd: 57,
    payout: 2.2,
  },
  {
    minute: 90,
    phase: "F",
    home: 1,
    away: 1,
    action: { Type: "comment", Data: { Text: "Full time" } },
    line: 50,
    question: "Did the match finish level?",
    trend: "Full time · Brazil 1–1 Morocco",
    crowd: 50,
    payout: 2.0,
  },
];

async function getTeamMetadata(name: string): Promise<SportsDbTeam | null> {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(name)}`,
      { next: { revalidate: 86_400 } }
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { teams?: SportsDbTeam[] | null };
    return (
      body.teams?.find((team) => team.strTeam === name) ??
      body.teams?.[0] ??
      null
    );
  } catch {
    return null;
  }
}

export async function getWorldCupFixture(): Promise<{
  fixture: WorldCupFixture;
  metadataSource: WorldCupTxLineFrame["source"]["fixtureMetadata"];
  teamMetadataSource: WorldCupTxLineFrame["source"]["teamMetadata"];
}> {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json",
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) throw new Error("fixture source unavailable");
    const body = (await response.json()) as { matches?: OpenFootballMatch[] };
    const match = body.matches?.find(
      (item) => item.team1 === "Brazil" && item.team2 === "Morocco"
    );
    if (!match) throw new Error("fixture not found");
    const [homeTeam, awayTeam] = await Promise.all([
      getTeamMetadata(match.team1 ?? fallbackFixture.home.name),
      getTeamMetadata(match.team2 ?? fallbackFixture.away.name),
    ]);
    return {
      metadataSource: "openfootball-2026",
      teamMetadataSource:
        homeTeam || awayTeam ? "thesportsdb" : "bundled-fallback",
      fixture: {
        ...fallbackFixture,
        home: {
          ...fallbackFixture.home,
          code: homeTeam?.strTeamShort ?? fallbackFixture.home.code,
          badge: homeTeam?.strBadge,
        },
        away: {
          ...fallbackFixture.away,
          code: awayTeam?.strTeamShort ?? fallbackFixture.away.code,
          badge: awayTeam?.strBadge,
        },
        stage: `${match.group ?? "Group C"} · ${match.round ?? "Group stage"}`,
        group: match.group ?? "Group C",
        stadium: match.ground ?? fallbackFixture.stadium,
        kickoff: `${match.date ?? "2026-06-13"} · ${match.time ?? "18:00 UTC-4"}`,
      },
    };
  } catch {
    return {
      fixture: fallbackFixture,
      metadataSource: "bundled-fallback",
      teamMetadataSource: "bundled-fallback",
    };
  }
}

function actionLabel(action: TxLineScoreUpdate["Action"]): string {
  if (!action) return "Match update";
  if (action.Type === "goal") return `GOAL · ${action.Player}`;
  if (action.Type === "shot")
    return `${action.Player ?? "Shot"} · ${String(action.Data?.Outcome ?? "attempt")}`;
  if (action.Type === "corner")
    return `Corner · ${action.Participant === 1 ? "Brazil" : "Morocco"}`;
  if (action.Type === "free_kick") return `Dangerous free kick · Morocco`;
  if (action.Type === "kick_off") return "Kick-off";
  return String(action.Data?.Text ?? "Match update");
}

export async function getWorldCupTxLineFrame(
  rawCursor: number
): Promise<WorldCupTxLineFrame> {
  const cursor = Math.max(
    0,
    Math.min(Math.floor(rawCursor), replay.length - 1)
  );
  const point = replay[cursor]!;
  const { fixture, metadataSource, teamMetadataSource } =
    await getWorldCupFixture();
  const ts = BASE_TS + point.minute * 60_000;
  const scoreUpdate: TxLineScoreUpdate = {
    FixtureId: fixture.fixtureId,
    Seq: cursor + 1,
    Ts: ts,
    GameState: point.phase,
    Clock: {
      Seconds: point.minute * 60,
      Running: point.phase === "H1" || point.phase === "H2",
    },
    Stats: {
      "1": { value: point.home },
      "2": { value: point.away },
      "7": { value: point.minute >= 27 ? 2 : 0 },
      "8": { value: point.minute >= 74 ? 3 : 1 },
    },
    Action: point.action,
  };
  return {
    mode: "txline_compatible_replay",
    source: {
      eventSchema: "txline-soccer-feed-v1.1",
      fixtureMetadata: metadataSource,
      teamMetadata: teamMetadataSource,
      verification: "unverified-no-merkle-proof",
      fixtureUrl:
        "https://github.com/openfootball/worldcup.json/tree/master/2026",
    },
    fixture,
    cursor,
    totalFrames: replay.length,
    scoreUpdate,
    oddsUpdate: {
      FixtureId: fixture.fixtureId,
      MessageId: `wc26-${fixture.fixtureId}-${cursor + 1}`,
      Ts: ts,
      SuperOddsType: "MatchWinner.Home",
      Pct: [point.line.toFixed(3), (100 - point.line).toFixed(3)],
      GameState: point.phase,
    },
    context: {
      scoreHome: point.home,
      scoreAway: point.away,
      minute: point.minute,
      phase: point.phase,
      lastEvent: actionLabel(point.action),
      nextQuestion: point.question,
      trend: point.trend,
      crowdYesPct: point.crowd,
      payout: point.payout,
    },
  };
}

/** Rejects replay frames that drift away from the documented TxLINE soccer envelope. */
export function assertTxLineCompatibleFrame(frame: WorldCupTxLineFrame): void {
  const score = frame.scoreUpdate;
  if (!Number.isInteger(score.FixtureId) || score.FixtureId <= 0) {
    throw new Error("TxLINE-compatible frame requires a positive FixtureId");
  }
  if (!Number.isInteger(score.Seq) || score.Seq <= 0) {
    throw new Error("TxLINE-compatible frame requires the observed replay Seq");
  }
  if (!Number.isFinite(score.Ts) || !score.Clock || !score.Stats) {
    throw new Error("TxLINE-compatible frame is missing Ts, Clock, or Stats");
  }
  for (const key of ["1", "2", "7", "8"] as const) {
    if (!Number.isFinite(score.Stats[key]?.value)) {
      throw new Error(`TxLINE-compatible frame is missing soccer stat ${key}`);
    }
  }
  if (frame.source.verification !== "unverified-no-merkle-proof") {
    throw new Error("Local replay frames must never claim TxLINE verification");
  }
}
