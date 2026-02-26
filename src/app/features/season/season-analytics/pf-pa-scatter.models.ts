/** One team's point for the PF vs PA scatter. */
export interface PfPaScatterPoint {
  x: number;
  y: number;
  teamName: string;
  abbrev: string;
  pointsFor: number;
  pointsAgainst: number;
  expectedWins: number;
  actualWins: number;
  luck: number;
}

/** Result for the scatter chart: points, league averages, and axis bounds. */
export interface PfPaScatterResult {
  points: PfPaScatterPoint[];
  avgPF: number;
  avgPA: number;
  /** Shared axis min/max so diagonal PF=PA fits. */
  axisMin: number;
  axisMax: number;
}
