import { Component, computed, inject } from '@angular/core';

import { DataTableComponent } from '../../../../shared/table';
import type { DataTableColumnDef, DataTableRow } from '../../../../shared/table';
import { SubsectionHeader } from '../../../../shared/components/subsection-header/subsection-header';
import { AllTimeRecordsService } from '../../records/records.service';

interface AllTimeAnalyticsTableRow extends DataTableRow {
  ownerName: string;
  totalSeasons: number;
  wins: number;
  allPlayWins: number;
  winPct: number;
  allPlayWinPct: number;
  avgPointsPerSeason: number;
  ppgAvg: number;
  pointsDiff: number;
}

const ALL_TIME_ANALYTICS_COLUMNS: DataTableColumnDef[] = [
  { key: 'ownerName', header: 'OwnerName', widthCh: 24 },
  { key: 'totalSeasons', header: 'Seasons', widthCh: 8, format: 'integer' },
  { key: 'wins', header: 'Wins', widthCh: 12, format: 'integer' },
  {
    key: 'allPlayWins',
    header: 'All Play Wins',
    widthCh: 12,
    defaultSort: true,
    format: 'integer',
  },
  { key: 'winPct', header: 'Win%', widthCh: 12, format: 'percent2' },
  { key: 'allPlayWinPct', header: 'All Play Win%', widthCh: 12, format: 'percent2' },
  { key: 'avgPointsPerSeason', header: 'Avg Pts/Season', widthCh: 13, format: 'decimal2' },
  { key: 'ppgAvg', header: 'Avg PPG', widthCh: 10, format: 'decimal2' },
  { key: 'pointsDiff', header: 'Points Diff', widthCh: 12, format: 'signedDecimal2' },
];

@Component({
  selector: 'app-all-time-analytics-table',
  imports: [DataTableComponent, SubsectionHeader],
  templateUrl: './analytics-table.html',
  styleUrl: './analytics-table.scss',
})
export class AnalyticsTable {
  private readonly allTimeRecords = inject(AllTimeRecordsService);

  protected readonly tableState = computed(() => {
    const records = this.allTimeRecords.toTableState().data;
    if (!records.length)
      return { columns: ALL_TIME_ANALYTICS_COLUMNS, data: [] as AllTimeAnalyticsTableRow[] };

    const data: AllTimeAnalyticsTableRow[] = records.map((row) => ({
      ownerName: row.ownerName,
      totalSeasons: row.totalSeasons,
      wins: row.wins,
      allPlayWins: row.allPlayWins,
      winPct: row.winPct,
      allPlayWinPct: row.allPlayWinPct,
      avgPointsPerSeason: row.avgPointsPerSeason,
      ppgAvg: row.ppgAvg,
      pointsDiff: row.pointsDiff,
    }));

    return { columns: ALL_TIME_ANALYTICS_COLUMNS, data };
  });
}
