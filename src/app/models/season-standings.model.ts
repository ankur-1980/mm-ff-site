/**
 * End-of-season standings entry for one owner in one season.
 * Matches season_standings-data.json structure.
 */
export interface SeasonStandingsEntry {
  playerDetails: {
    managerName: string;
    teamName: string;
  };
  season: string;
  record: {
    win: number;
    loss: number;
    tie: number;
  };
  ranks: {
    playoffRank: string;
    regularSeasonRank: string;
    madePlayoffs: string;
  };
  points: {
    pointsFor: number;
    pointsAgainst: number;
    highPoints: number;
    lowPoints?: number;
  };
  transactions: {
    moves: number;
    trades: number;
  };
}

/** Standings for a single season: owner id (managerName) -> entry. */
export type SeasonStandings = Record<string, SeasonStandingsEntry>;

/** Raw payload: season id (year string) -> standings for that season. */
export type SeasonStandingsData = Record<string, SeasonStandings>;
