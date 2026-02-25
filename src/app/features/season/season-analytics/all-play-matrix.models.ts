/** Record from one team's perspective vs another (if they played every week). */
export interface AllPlayPairRecord {
  wins: number;
  losses: number;
  ties: number;
}

/** Result of computing the all-play matrix for a season. */
export interface AllPlayMatrixResult {
  /** Team names in display order (e.g. by all-play win total descending). */
  teamNames: string[];
  /** Get record for row team vs column team. (rowTeam, colTeam) -> record from row's perspective. */
  getRecord(rowTeam: string, colTeam: string): AllPlayPairRecord;
  /** Get total all-play record for a team (sum over all opponents). */
  getTotalRecord(team: string): AllPlayPairRecord;
  /** Total regular-season weeks used. */
  weeksCount: number;
}
