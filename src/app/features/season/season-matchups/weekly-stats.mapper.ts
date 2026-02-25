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
): Pick<WeekStats, 'highScore' | 'lowScore' | 'biggestLoser' | 'narrowestWin'> {
  const teams = allTeams(matchups);

  if (teams.length === 0) {
    return { highScore: null, lowScore: null, biggestLoser: null, narrowestWin: null };
  }

  let high = teams[0];
  let low = teams[0];

  for (const team of teams.slice(1)) {
    if (team.totalPoints > high.totalPoints) high = team;
    if (team.totalPoints < low.totalPoints) low = team;
  }

  let biggestLoser: WeekStat | null = null;
  let narrowestWin: WeekStat | null = null;

  for (const matchup of matchups) {
    const { team1, team2 } = matchup;
    if (!team1.result || !team2.result) continue;

    const [winner, loser] =
      team1.result === 'winner' ? [team1, team2] : [team2, team1];
    const margin = winner.totalPoints - loser.totalPoints;

    if (!biggestLoser || margin > (biggestLoser.margin ?? 0)) {
      biggestLoser = { ...toWeekStat(loser), margin };
    }
    if (!narrowestWin || margin < (narrowestWin.margin ?? Infinity)) {
      narrowestWin = { ...toWeekStat(winner), margin };
    }
  }

  return { highScore: toWeekStat(high), lowScore: toWeekStat(low), biggestLoser, narrowestWin };
}

/**
 * Find the teams with the greatest and smallest delta between actual and
 * projected points. Teams without a projection are excluded.
 */
function toProjectionStats(
  matchups: MappedMatchup[]
): Pick<WeekStats, 'exceededExpectation' | 'underperformed'> {
  let exceeded: WeekStat | null = null;
  let underperformed: WeekStat | null = null;

  for (const team of allTeams(matchups)) {
    if (!team.projectedPoints) continue;
    const delta = team.totalPoints - team.projectedPoints;

    if (!exceeded || delta > (exceeded.delta ?? -Infinity)) {
      exceeded = { ...toWeekStat(team), delta };
    }
    if (!underperformed || delta < (underperformed.delta ?? Infinity)) {
      underperformed = { ...toWeekStat(team), delta };
    }
  }

  return { exceededExpectation: exceeded, underperformed };
}

/**
 * Find the starter with the highest percentage contribution to their team's
 * total score for the week.
 */
function toMvpStat(
  weekMatchups: WeekMatchups,
  ownerIndex: Map<string, string>
): Pick<WeekStats, 'mvp'> {
  let mvp: PlayerStat | null = null;

  for (const entry of Object.values(weekMatchups)) {
    if (!entry.matchup?.team1Name) continue;
    const teamTotal = entry.team1Totals.totalPoints;
    if (!teamTotal) continue;

    const teamName = entry.matchup.team1Name;
    const ownerName = ownerIndex.get(teamName) ?? '';

    for (const player of entry.team1Roster) {
      if (player.slot !== 'starter' || player.points <= 0) continue;
      const percentage = (player.points / teamTotal) * 100;

      if (!mvp || percentage > (mvp.percentage ?? 0)) {
        mvp = {
          playerName: player.playerName,
          position: player.position,
          nflTeam: player.nflTeam,
          points: player.points,
          teamName,
          ownerName,
          percentage,
        };
      }
    }
  }

  return { mvp };
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
    ...toProjectionStats(matchups),
    ...toMvpStat(weekMatchups, ownerIndex),
    ...toStarterStats(weekMatchups, ownerIndex),
  };
}
