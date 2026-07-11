export type AgentTeam = {
  topic: string;
  slug: string;
  name: string;
  aliases: string[];
};

export type TeamSlug = string;

export function normalizeAgentTeams(teams?: AgentTeam[]): AgentTeam[] {
  const byKey = new Map<string, AgentTeam>();
  for (const team of teams ?? []) {
    const topic = team.topic.trim().toLowerCase();
    const slug = team.slug.trim().toLowerCase();
    const name = team.name.trim().replace(/\s+/g, " ").slice(0, 80);
    if (!topic || !slug || !name) continue;
    const aliases = [
      name,
      slug,
      ...team.aliases,
    ]
      .map((alias) => alias.trim().replace(/\s+/g, " ").slice(0, 80))
      .filter(Boolean);
    byKey.set(`${topic}:${slug}`, {
      topic,
      slug,
      name,
      aliases: [...new Set(aliases)],
    });
  }
  return [...byKey.values()];
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function teamMatchesFixture(
  team: AgentTeam,
  fixture: { home_name?: string | null; away_name?: string | null } | null,
): boolean {
  if (!fixture?.home_name && !fixture?.away_name) return false;
  const home = normalizeText(fixture.home_name ?? "");
  const away = normalizeText(fixture.away_name ?? "");
  return team.aliases.some((alias) => {
    const normalized = normalizeText(alias);
    return home === normalized || away === normalized;
  });
}
