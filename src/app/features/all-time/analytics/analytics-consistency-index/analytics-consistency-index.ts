import { Component, computed, inject } from '@angular/core';

import { DataTableComponent } from '../../../../shared/table';
import type { DataTableColumnDef, DataTableRow } from '../../../../shared/table';
import { ConsistencyIndexService } from './consistency-index.service';

interface ConsistencyIndexRow extends DataTableRow {
  ownerName: string;
  seasonsIncluded: number;
  averageSeasonIqr: number;
  averagePpgStdDev: number;
}

const COLUMNS: DataTableColumnDef[] = [
  { key: 'ownerName', header: 'OwnerName', widthCh: 24 },
  { key: 'seasonsIncluded', header: 'Seasons', widthCh: 8, format: 'integer' },
  { key: 'averageSeasonIqr', header: 'Avg Season IQR', widthCh: 14, format: 'decimal2' },
  {
    key: 'averagePpgStdDev',
    header: 'Avg PPG Std Dev',
    widthCh: 14,
    defaultSort: true,
    format: 'decimal2',
  },
];

@Component({
  selector: 'app-all-time-analytics-consistency-index',
  imports: [DataTableComponent],
  templateUrl: './analytics-consistency-index.html',
  styleUrl: './analytics-consistency-index.scss',
})
export class AnalyticsConsistencyIndex {
  private readonly consistency = inject(ConsistencyIndexService);

  protected readonly tableState = computed(() => {
    const rows: ConsistencyIndexRow[] = this.consistency
      .buildCareerConsistencyIndex()
      .map((row) => ({
        ownerName: row.ownerName,
        seasonsIncluded: row.seasonsIncluded,
        averageSeasonIqr: row.averageSeasonIqr,
        averagePpgStdDev: row.averagePpgStdDev,
      }));

    return { columns: COLUMNS, data: rows };
  });
}
