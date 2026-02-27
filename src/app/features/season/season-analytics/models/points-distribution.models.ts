/** One week's points for a team (for outlier tooltip). */
export interface WeekPoints {
  week: number;
  points: number;
}

/** Box plot statistics for one team (regular season weekly points). */
export interface BoxPlotTeamStats {
  teamName: string;
  /** Sorted weekly points (for reference). */
  points: number[];
  /** Week and points for each point (same order as points). */
  weekPoints: WeekPoints[];
  q1: number;
  median: number;
  q3: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
  lowerWhisker: number;
  upperWhisker: number;
  /** Points outside fences: week + value for tooltip. */
  outliers: WeekPoints[];
}
