/** One histogram bin for margin of victory. */
export interface MarginOfVictoryBin {
  /** Display label (e.g. "0–5", "5–10"). */
  label: string;
  /** Bin minimum (inclusive). */
  min: number;
  /** Bin maximum (exclusive for all but last; last is inclusive). */
  max: number;
  /** Number of games in this bin. */
  count: number;
}

/** Histogram result for the margin-of-victory chart. */
export interface MarginOfVictoryDistributionResult {
  bins: MarginOfVictoryBin[];
}
