import type { WeekMatchups } from '../../../models/weekly-matchups.model';
import type { MatchupTeamData, MappedMatchup } from './matchup.models';
import type { PlayerStat, WeekStat, WeekStats } from './weekly-stats.models';

function allTeams(matchups: MappedMatchup[]): MatchupTeamData[] {
  return matchups.flatMap((m) => [m.team1, m.team2]);
}

function toWeekStat(team: MatchupTeamData): WeekStat {
  return { teamName: team.teamName, ownerName: team.ownerName, score: team.totalPoints };
}

/**
 * Derive aggregate team stats for a single week from already-mapped matchup data.
 * All values are null when no matchups are present (e.g. unplayed week).
 */
function toTeamStats(
  matchups: MappedMatchup[]
): Pick<WeekStats, 'highScore' | 'lowScore'> {
  const teams = allTeams(matchups);

  if (teams.length === 0) {
    return { highScore: null, lowScore: null };
  }

  let high = teams[0];
  let low = teams[0];

  for (const team of teams.slice(1)) {
    if (team.totalPoints > high.totalPoints) high = team;
    if (team.totalPoints < low.totalPoints) low = team;
  }

  return { highScore: toWeekStat(high), lowScore: toWeekStat(low) };
}

/**
 * Find the highest and lowest scoring individual starters across all teams
 * for a week, using the raw week entries for roster access.
 */
function toStarterStats(
  weekMatchups: WeekMatchups,
  ownerIndex: Map<string, string>
): Pick<WeekStats, 'highStarter' | 'lowStarter'> {
  const starters: PlayerStat[] = [];

  for (const entry of Object.values(weekMatchups)) {
    if (!entry.matchup?.team1Name) continue;
    const teamName = entry.matchup.team1Name;
    const ownerName = ownerIndex.get(teamName) ?? '';

    for (const player of entry.team1Roster) {
      if (player.slot !== 'starter') continue;
      starters.push({
        playerName: player.playerName,
        position: player.position,
        nflTeam: player.nflTeam,
        points: player.points,
        teamName,
        ownerName,
      });
    }
  }

  if (starters.length === 0) {
    return { highStarter: null, lowStarter: null };
  }

  const scoringStarters = starters.filter((s) => s.points > 0);

  let high = starters[0];
  for (const starter of starters.slice(1)) {
    if (starter.points > high.points) high = starter;
  }

  let low: PlayerStat | null = scoringStarters[0] ?? null;
  for (const starter of scoringStarters.slice(1)) {
    if (starter.points < low!.points) low = starter;
  }

  return { highStarter: high, lowStarter: low };
}

/**
 * Derive all aggregate stats for a single week.
 * Team stats are derived from mapped matchups; player stats from raw entries.
 */
export function toWeekStats(
  matchups: MappedMatchup[],
  weekMatchups: WeekMatchups,
  ownerIndex: Map<string, string>
): WeekStats {
  return {
    ...toTeamStats(matchups),
    ...toStarterStats(weekMatchups, ownerIndex),
  };
}
