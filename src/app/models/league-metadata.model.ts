/**
 * Per-season metadata from league-metadata.json.
 */
export interface SeasonMetaData {
  /** Last regular season week for this year. */
  regularSeasonEndWeek: number;
  /** Final week the league plays that year (usually playoffs). */
  seasonEndWeek: number;
  /** Whether we have full historical details for this season. */
  hasFullHistoricalDetails: boolean;
}

/**
 * Minimal league metadata loaded from league-metadata.json.
 */
export interface LeagueMetaData {
  name: string;
  /** Season id (e.g. year number) for the current season. */
  currentSeasonId?: number;
  /** Map of season year -> season metadata. */
  seasons?: Record<string, SeasonMetaData>;
}
