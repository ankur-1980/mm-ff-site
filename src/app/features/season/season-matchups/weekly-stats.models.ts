/** A single team's score entry used in weekly stat computations. */
export interface WeekStat {
  teamName: string;
  ownerName: string;
  score: number;
}

/** A single player's score entry used in weekly stat computations. */
export interface PlayerStat {
  playerName: string;
  position: string;
  nflTeam: string;
  points: number;
  teamName: string;
  ownerName: string;
}

/** Aggregated stats for one week. Null when no matchup data is available. */
export interface WeekStats {
  highScore: WeekStat | null;
  lowScore: WeekStat | null;
  highStarter: PlayerStat | null;
  lowStarter: PlayerStat | null;
}
