import type { WeekMatchups } from '../../../models/weekly-matchups.model';
import type { OwnersData } from '../../../models/owner.model';
import type { MatchupResult, MatchupTeamData, MappedMatchup } from './matchup.models';

/**
 * Build a lookup map from every known team name to the manager name of its owner.
 * An owner may have used different team names across seasons; all are indexed.
 */
export function buildOwnerIndex(ownersData: OwnersData): Map<string, string> {
  const index = new Map<string, string>();
  for (const owner of Object.values(ownersData)) {
    for (const teamName of owner.teamNames) {
      index.set(teamName, owner.managerName);
    }
  }
  return index;
}

function resolveResult(score: number, opponentScore: number): MatchupResult {
  if (score > opponentScore) return 'winner';
  if (score < opponentScore) return 'loser';
  return null;
}

function toTeamData(
  teamName: string,
  totalPoints: number,
  totalProjected: number,
  result: MatchupResult,
  ownerIndex: Map<string, string>
): MatchupTeamData {
  return {
    teamName,
    ownerName: ownerIndex.get(teamName) ?? '',
    totalPoints,
    projectedPoints: totalProjected > 0 ? totalProjected : null,
    result,
  };
}

/**
 * Convert a week's raw entry map into one MappedMatchup per game.
 * Each entry represents one team's view; both halves of the card are populated
 * by pairing each entry with the opposing team's entry via the teamId key.
 * Results are sorted by highest score in the matchup (descending).
 */
export function toMappedMatchups(
  weekMatchups: WeekMatchups,
  ownerIndex: Map<string, string>
): MappedMatchup[] {
  const seen = new Set<string>();
  const pairs: MappedMatchup[] = [];

  for (const entry of Object.values(weekMatchups)) {
    const { matchup, team1Totals } = entry;
    const key = [matchup.team1Id, matchup.team2Id].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);

    const team1Score = Number(matchup.team1Score);
    const team2Score = Number(matchup.team2Score);

    // Locate team2's entry by its teamId key to get their actual totals
    const team2Entry = weekMatchups[`teamId-${matchup.team2Id}`];

    pairs.push({
      team1: toTeamData(
        matchup.team1Name,
        team1Totals.totalPoints,
        team1Totals.totalProjected,
        resolveResult(team1Score, team2Score),
        ownerIndex
      ),
      team2: toTeamData(
        matchup.team2Name,
        team2Entry ? team2Entry.team1Totals.totalPoints : team2Score,
        team2Entry ? team2Entry.team1Totals.totalProjected : 0,
        resolveResult(team2Score, team1Score),
        ownerIndex
      ),
    });
  }

  return pairs.sort(
    (a, b) =>
      Math.max(b.team1.totalPoints, b.team2.totalPoints) -
      Math.max(a.team1.totalPoints, a.team2.totalPoints)
  );
}
