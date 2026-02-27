/**
 * Per-week and cumulative all-play wins for each team.
 * weeklyWinsByTeam[teamName][weekIndex] = all-play wins in that week.
 * cumulativeByTeam[teamName][weekIndex] = total all-play wins through that week.
 */
export interface WeeklyAllPlayWinsResult {
  weekNumbers: number[];
  teamNames: string[];
  weeklyWinsByTeam: Map<string, number[]>;
  cumulativeByTeam: Map<string, number[]>;
}
