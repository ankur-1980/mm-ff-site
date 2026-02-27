/** One team's rank per week (index i = rank in week i). Rank 1 = highest score that week. */
export interface WeeklyRankTrajectoryResult {
  /** Week numbers in order (e.g. [1, 2, ..., 14]). */
  weekNumbers: number[];
  /** Team display names (order stable for color assignment). */
  teamNames: string[];
  /** Per team: array of rank per week (same length as weekNumbers). Missing week = null. */
  rankByTeam: Map<string, (number | null)[]>;
}
