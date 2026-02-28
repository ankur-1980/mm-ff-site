export type MatchupResult = 'winner' | 'loser' | null;

export interface MatchupTeam {
  teamName?: string;
  ownerName?: string;
  totalPoints: number;
  result: MatchupResult;
}

export interface MatchupTeamData extends MatchupTeam {
  teamName: string;
  ownerName: string;
  projectedPoints: number | null;
}

export interface MappedMatchup {
  team1: MatchupTeamData;
  team2: MatchupTeamData;
}
