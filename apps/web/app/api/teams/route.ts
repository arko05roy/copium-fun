import { normalizeAgentTeams, type AgentTeam } from "@copium/db/teams";
import { NextResponse } from "next/server";

const ESPN_TEAM_ENDPOINTS: Record<string, { sport: string; league: string }[]> =
  {
    basketball: [{ sport: "basketball", league: "nba" }],
    football: [{ sport: "football", league: "nfl" }],
    soccer: [
      { sport: "soccer", league: "fifa.world" },
      { sport: "soccer", league: "eng.1" },
      { sport: "soccer", league: "esp.1" },
      { sport: "soccer", league: "uefa.champions" },
    ],
    "world-cup": [{ sport: "soccer", league: "fifa.world" }],
  };

type EspnTeam = {
  team?: {
    abbreviation?: string;
    displayName?: string;
    name?: string;
    shortDisplayName?: string;
    location?: string;
  };
};

type EspnTeamsResponse = {
  sports?: {
    leagues?: {
      teams?: EspnTeam[];
    }[];
  }[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

async function fetchEspnTeams(topic: string): Promise<AgentTeam[]> {
  const endpoints = ESPN_TEAM_ENDPOINTS[topic] ?? [];
  const teams: AgentTeam[] = [];
  for (const endpoint of endpoints) {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${endpoint.sport}/${endpoint.league}/teams`;
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 6 } });
    if (!res.ok) continue;
    const json = (await res.json()) as EspnTeamsResponse;
    for (const sport of json.sports ?? []) {
      for (const league of sport.leagues ?? []) {
        for (const entry of league.teams ?? []) {
          const team = entry.team;
          const name = team?.displayName?.trim();
          if (!name) continue;
          const aliases = [
            name,
            team?.shortDisplayName,
            team?.name,
            team?.location,
            team?.abbreviation,
          ].filter((value): value is string => Boolean(value?.trim()));
          teams.push({
            topic,
            slug: slugify(name),
            name,
            aliases,
          });
        }
      }
    }
  }
  return normalizeAgentTeams(teams).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const topics = [
    ...new Set(
      (params.get("topics") ?? "soccer,basketball,football")
        .split(",")
        .map((topic) => topic.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  try {
    const nested = await Promise.all(topics.map((topic) => fetchEspnTeams(topic)));
    return NextResponse.json({ ok: true, teams: nested.flat() });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "team fetch failed",
      },
      { status: 502 },
    );
  }
}

