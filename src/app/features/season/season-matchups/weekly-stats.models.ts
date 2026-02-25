/** A single team's score entry used in weekly stat computations. */
export interface WeekStat {
  teamName: string;
  ownerName: string;
  score: number;
  /** Point margin of defeat — only present for biggest-loser / narrowest-win entries. */
  margin?: number;
  /** Delta between actual and projected points — only present for projection-based entries. */
  delta?: number;
}

/** A single player's score entry used in weekly stat computations. */
export interface PlayerStat {
  playerName: string;
  position: string;
  nflTeam: string;
  points: number;
  teamName: string;
  ownerName: string;
  /** Percentage of team's total score — only present for MVP entries. */
  percentage?: number;
}

/** Aggregated stats for one week. Null when no matchup data is available. */
export interface WeekStats {
  highScore: WeekStat | null;
  lowScore: WeekStat | null;
  biggestLoser: WeekStat | null;
  narrowestWin: WeekStat | null;
  exceededExpectation: WeekStat | null;
  underperformed: WeekStat | null;
  mvp: PlayerStat | null;
  highStarter: PlayerStat | null;
  lowStarter: PlayerStat | null;
}
