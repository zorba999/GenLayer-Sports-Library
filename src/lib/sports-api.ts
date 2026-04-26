/**
 * sports-api.ts
 * Direct browser calls to ESPN + Jolpica (no proxy needed).
 * Mirrors the logic in ui/server.py.
 */

const UA_HEADERS = { Accept: "application/json,*/*" };

const FINISHED = new Set([
  "STATUS_FINAL","STATUS_FULL_TIME","STATUS_FT","STATUS_END_GAME","STATUS_POSTPONED"
]);
const ONGOING = new Set([
  "STATUS_IN_PROGRESS","STATUS_HALFTIME","STATUS_END_PERIOD","STATUS_LIVE"
]);
const UPCOMING = new Set([
  "STATUS_SCHEDULED","STATUS_PREGAME","STATUS_PRE_GAME","STATUS_WARMUP"
]);

export type SportResult = {
  winner: number | string;
  score?: string;
  sets?: string;
  team?: string;
  status: "finished" | "ongoing" | "upcoming" | "not_found";
  error?: string;
};

function matchName(query: string, names: string[]): boolean {
  const q = query.toLowerCase().trim();
  return names.some(n => q.includes(n) || n.includes(q));
}

// ── Football (Soccer) ────────────────────────────────────────────────────────
export async function getFootballResult(
  team1: string, team2: string, date: string
): Promise<SportResult> {
  const dateCompact = date.replace(/-/g, "");
  const leagues = ["eng.1","esp.1","ger.1","ita.1","fra.1","uefa.champions","uefa.europa","eng.2","usa.1"];

  for (const league of leagues) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${dateCompact}`;
      const data = await fetch(url, { headers: UA_HEADERS }).then(r => r.json());

      for (const event of data.events ?? []) {
        const comp = event.competitions?.[0];
        const competitors: unknown[] = comp?.competitors ?? [];
        if (competitors.length < 2) continue;

        const names = (competitors as { team?: { displayName?: string } }[]).map(c => c.team?.displayName?.toLowerCase() ?? "");
        const shorts = (competitors as { team?: { shortDisplayName?: string } }[]).map(c => c.team?.shortDisplayName?.toLowerCase() ?? "");
        const allNames = [...names, ...shorts];

        if (!matchName(team1, allNames) || !matchName(team2, allNames)) continue;

        const statusName: string = event.status?.type?.name ?? "";
        const scores = (competitors as { score?: string }[]).map(c => parseInt(c.score ?? "0") || 0);
        const wins = (competitors as { winner?: boolean }[]).map(c => c.winner ?? false);
        const idx1 = matchName(team1, [names[0], shorts[0]]) ? 0 : 1;
        const idx2 = 1 - idx1;
        const s1 = scores[idx1], s2 = scores[idx2];

        if (FINISHED.has(statusName)) {
          const winner = wins[idx1] ? 1 : wins[idx2] ? 2 : s1 > s2 ? 1 : s2 > s1 ? 2 : 0;
          return { winner, score: `${s1}:${s2}`, status: "finished" };
        } else if (UPCOMING.has(statusName)) {
          return { winner: -1, score: "-", status: "upcoming" };
        } else {
          return { winner: -1, score: `${s1}:${s2}`, status: "ongoing" };
        }
      }
    } catch { /* try next league */ }
  }
  return { winner: -1, score: "-", status: "not_found" };
}

// ── Basketball (NBA) ─────────────────────────────────────────────────────────
export async function getBasketballResult(
  team1: string, team2: string, date: string
): Promise<SportResult> {
  const dateCompact = date.replace(/-/g, "");
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateCompact}`;
    const data = await fetch(url, { headers: UA_HEADERS }).then(r => r.json());

    for (const event of data.events ?? []) {
      const competitors: unknown[] = event.competitions?.[0]?.competitors ?? [];
      if (competitors.length < 2) continue;

      const names = (competitors as { team?: { displayName?: string } }[]).map(c => c.team?.displayName?.toLowerCase() ?? "");
      const shorts = (competitors as { team?: { shortDisplayName?: string } }[]).map(c => c.team?.shortDisplayName?.toLowerCase() ?? "");
      const allNames = [...names, ...shorts];

      if (!matchName(team1, allNames) || !matchName(team2, allNames)) continue;

      const statusName: string = event.status?.type?.name ?? "";
      const scores = (competitors as { score?: string }[]).map(c => parseInt(c.score ?? "0") || 0);
      const wins = (competitors as { winner?: boolean }[]).map(c => c.winner ?? false);
      const idx1 = matchName(team1, [names[0], shorts[0]]) ? 0 : 1;
      const idx2 = 1 - idx1;
      const s1 = scores[idx1], s2 = scores[idx2];

      if (FINISHED.has(statusName)) {
        const winner = wins[idx1] ? 1 : wins[idx2] ? 2 : s1 > s2 ? 1 : s2 > s1 ? 2 : -1;
        return { winner, score: `${s1}:${s2}`, status: "finished" };
      } else if (UPCOMING.has(statusName)) {
        return { winner: -1, score: "-", status: "upcoming" };
      } else {
        return { winner: -1, score: `${s1}:${s2}`, status: "ongoing" };
      }
    }
  } catch (e) {
    return { winner: -1, score: "-", status: "not_found", error: String(e) };
  }
  return { winner: -1, score: "-", status: "not_found" };
}

// ── Formula 1 (Jolpica / Ergast) ─────────────────────────────────────────────
export async function getF1RaceWinner(raceName: string, year: number): Promise<SportResult> {
  const short = raceName.toLowerCase().replace("grand prix","").replace("gp","").trim();
  try {
    // Results (finished races)
    const url = `https://api.jolpi.ca/ergast/f1/${year}/results/1.json?limit=25`;
    const data = await fetch(url, { headers: UA_HEADERS }).then(r => r.json());
    const races = data?.MRData?.RaceTable?.Races ?? [];

    for (const race of races) {
      const rn: string = (race.raceName ?? "").toLowerCase();
      const circuit: string = (race.Circuit?.circuitName ?? "").toLowerCase();
      const locality: string = (race.Circuit?.Location?.locality ?? "").toLowerCase();
      const country: string = (race.Circuit?.Location?.country ?? "").toLowerCase();
      const targets = [rn, circuit, locality, country];

      if (targets.some(t => short.includes(t) || t.includes(short))) {
        const results = race.Results ?? [];
        if (results.length > 0) {
          const w = results[0];
          const name = `${w.Driver?.givenName ?? ""} ${w.Driver?.familyName ?? ""}`.trim();
          const team = w.Constructor?.name ?? "unknown";
          return { winner: name, team, status: "finished" };
        }
        return { winner: "unknown", team: "unknown", status: "upcoming" };
      }
    }

    // Check schedule for upcoming
    const sched = await fetch(`https://api.jolpi.ca/ergast/f1/${year}.json`, { headers: UA_HEADERS }).then(r => r.json());
    for (const race of sched?.MRData?.RaceTable?.Races ?? []) {
      const rn: string = (race.raceName ?? "").toLowerCase();
      const locality: string = (race.Circuit?.Location?.locality ?? "").toLowerCase();
      const country: string = (race.Circuit?.Location?.country ?? "").toLowerCase();
      if ([rn, locality, country].some(t => short.includes(t) || t.includes(short))) {
        return { winner: "unknown", team: "unknown", status: "upcoming" };
      }
    }
  } catch (e) {
    return { winner: "unknown", team: "unknown", status: "not_found", error: String(e) };
  }
  return { winner: "unknown", team: "unknown", status: "not_found" };
}

// ── Tennis ───────────────────────────────────────────────────────────────────
export async function getTennisResult(
  player1: string, player2: string, tournament: string
): Promise<SportResult> {
  const p1 = player1.toLowerCase();
  const p2 = player2.toLowerCase();
  const tourShort = tournament.toLowerCase().split(" ")[0];

  for (const league of ["atp", "wta"]) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/tennis/${league}/scoreboard`;
      const data = await fetch(url, { headers: UA_HEADERS }).then(r => r.json());

      for (const event of data.events ?? []) {
        const eventName: string = (event.name ?? "").toLowerCase();
        if (tourShort && !eventName.includes(tourShort)) continue;

        const competitors: unknown[] = event.competitions?.[0]?.competitors ?? [];
        if (competitors.length < 2) continue;

        const names = (competitors as { athlete?: { displayName?: string } }[]).map(c => c.athlete?.displayName?.toLowerCase() ?? "");
        if (!names.some(n => p1.includes(n) || n.includes(p1))) continue;
        if (!names.some(n => p2.includes(n) || n.includes(p2))) continue;

        const statusName: string = event.status?.type?.name ?? "";
        const idx1 = (p1.includes(names[0]) || names[0].includes(p1)) ? 0 : 1;
        const idx2 = 1 - idx1;

        if (statusName === "STATUS_FINAL") {
          const sc1 = (competitors as { score?: string }[])[idx1]?.score ?? "0";
          const sc2 = (competitors as { score?: string }[])[idx2]?.score ?? "0";
          const s1 = parseInt(sc1) || 0, s2 = parseInt(sc2) || 0;
          return { winner: s1 > s2 ? 1 : s2 > s1 ? 2 : -1, sets: `${s1}:${s2}`, status: "finished" };
        } else if (statusName === "STATUS_SCHEDULED") {
          return { winner: -1, sets: "-", status: "upcoming" };
        } else {
          return { winner: -1, sets: "-", status: "ongoing" };
        }
      }
    } catch { /* try next league */ }
  }
  return { winner: -1, sets: "-", status: "not_found" };
}
