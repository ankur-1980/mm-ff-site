export type MatchupResult = 'winner' | 'loser' | null;

export interface MatchupTeamData {
  teamName: string;
  ownerName: string;
  totalPoints: number;
  projectedPoints: number | null;
  result: MatchupResult;
}

export interface MappedMatchup {
  team1: MatchupTeamData;
  team2: MatchupTeamData;
}
