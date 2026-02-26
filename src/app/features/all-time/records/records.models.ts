import type { DataTableColumnDef, DataTableRow } from '../../../shared/table';

export interface AllTimeRecordRow extends DataTableRow {
  ownerName: string;
  totalSeasons: number;
  wins: number;
  losses: number;
  ties: number;
  allPlayWins: number;
  allPlayLosses: number;
  allPlayWinPct: number;
  championships: number;
  highPoints: number;
  lowPoints: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  gp: number;
  winPct: number;
  ppgAvg: number;
  moves: number;
  trades: number;
  winSortValue: number;
}

export interface AllTimeRecordsTableState {
  columns: DataTableColumnDef[];
  data: AllTimeRecordRow[];
}

export interface ChampionTimelineEntry {
  year: string;
  ownerName: string;
  teamName: string;
}

export interface OwnerRecordTotals {
  wins: number;
  losses: number;
  ties: number;
  allPlayWins: number;
  allPlayLosses: number;
  allPlayTies: number;
  championships: number;
  highPoints: number;
  lowPoints: number;
  moves: number;
  trades: number;
  pointsFor: number;
  pointsAgainst: number;
}
