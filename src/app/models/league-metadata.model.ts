/**
 * Minimal league metadata loaded from league-metadata.json.
 */
export interface LeagueMetaData {
  name: string;
  /** Season id (e.g. year number) for the current season. */
  currentSeasonId?: number;
}
