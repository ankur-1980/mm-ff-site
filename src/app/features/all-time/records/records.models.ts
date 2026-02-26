import type { DataTableColumnDef, DataTableRow } from '../../../shared/table';

export interface AllTimeRecordRow extends DataTableRow {
  ownerName: string;
  wins: number;
  losses: number;
  ties: number;
  winSortValue: number;
}

export interface AllTimeRecordsTableState {
  columns: DataTableColumnDef[];
  data: AllTimeRecordRow[];
}

export interface OwnerRecordTotals {
  wins: number;
  losses: number;
  ties: number;
}
