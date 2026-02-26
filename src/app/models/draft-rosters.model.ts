/**
 * One drafted player row in a team's seasonal draft roster.
 * Matches draft_rosters.json structure.
 */
export interface DraftRosterPlayer {
  TeamName: string;
  PickOrder: string;
  PlayerName: string;
  PlayerId: string;
  Position: string;
  NFLTeam: string;
  Cost: string;
}

/** One team roster for a season draft. */
export type DraftRosterTeam = DraftRosterPlayer[];

/** One season's draft data: team name -> drafted players. */
export type DraftRostersSeason = Record<string, DraftRosterTeam>;

/** Raw payload: season id (year string) -> season draft data. */
export type DraftRostersData = Record<string, DraftRostersSeason>;
