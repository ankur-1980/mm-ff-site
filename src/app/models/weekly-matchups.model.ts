/**
 * One player row in a team's roster for a matchup.
 * Matches team1Roster items in weekly matchups JSON.
 */
export interface RosterPlayer {
  playerId: string;
  playerName: string;
  position: string;
  nflTeam: string;
  points: number;
  slot: 'starter' | 'bench';
}

/**
 * Matchup summary: two teams and scores.
 * Scores are strings in the source JSON.
 */
export interface MatchupSummary {
  team1Id: string;
  team1Name: string;
  team1Score: string;
  team2Id: string;
  team2Name: string;
  team2Score: string;
}

/**
 * Totals for the "team1" view (the team this entry belongs to).
 */
export interface TeamTotals {
  totalPoints: number;
  totalProjected: number;
  benchPoints: number;
  benchProjected: number;
}

/**
 * One team's view of a single week's matchup (season, week, matchup summary, totals, roster).
 */
export interface WeeklyMatchupEntry {
  season: number;
  week: number;
  teamId: string;
  matchup: MatchupSummary;
  team1Totals: TeamTotals;
  team1Roster: RosterPlayer[];
}

/** All team entries for one week: key is "teamId-{id}". */
export type WeekMatchups = Record<string, WeeklyMatchupEntry>;

/** All weeks in a season: key is "week1" | "week2" | ... | "week17". */
export type SeasonWeekMatchups = Record<string, WeekMatchups>;

/** Raw payload: season id (year string) -> weeks -> team entries. */
export type WeeklyMatchupsData = Record<string, SeasonWeekMatchups>;
