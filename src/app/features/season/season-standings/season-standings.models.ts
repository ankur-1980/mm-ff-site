import type { DataTableColumnDef, DataTableRow } from '../../../shared/table';

export interface SeasonStandingsRow extends DataTableRow {
  playoffRank: string | null;
  regularSeasonRank: number | null;
  teamName: string;
  managerName: string;
  win: number;
  loss: number;
  tie: number;
  gp: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  highPoints: number;
  lowPoints: number | null;
  diff: number;
  moves: number;
  trades: number;
}

export interface SeasonStandingsTableState {
  columns: DataTableColumnDef[];
  data: SeasonStandingsRow[];
}

export interface TeamRecordByTeam {
  winsByTeam: Map<string, number>;
  lossesByTeam: Map<string, number>;
  tiesByTeam: Map<string, number>;
  pointsForByTeam: Map<string, number>;
  pointsAgainstByTeam: Map<string, number>;
  highPointFinishesByTeam: Map<string, number>;
  lowPointFinishesByTeam: Map<string, number>;
  hasRegularSeasonHistory: boolean;
}

export interface ResolvedTeamStats {
  standingsWin: number;
  standingsLoss: number;
  standingsTie: number;
  standingsPointsFor: number;
  standingsPointsAgainst: number;
  matchupWin: number | null;
  matchupLoss: number | null;
  matchupTie: number | null;
  matchupPointsFor: number | null;
  matchupPointsAgainst: number | null;
  win: number;
  loss: number;
  tie: number;
  pointsFor: number;
  pointsAgainst: number;
  highPoints: number;
  lowPoints: number | null;
  gp: number;
  winPct: number;
  diff: number;
}
