import { Component, computed, inject } from '@angular/core';

import { DataTableComponent } from '../../../../shared/table';
import type { DataTableColumnDef, DataTableRow } from '../../../../shared/table';
import { AllTimeAllPlayMatrixService } from '../../all-play/all-play-matrix.service';

interface AllTimeAnalyticsTableRow extends DataTableRow {
  ownerName: string;
  allPlayWins: number;
  allPlayLosses: number;
  allPlayWinPct: number;
}

const ALL_TIME_ANALYTICS_COLUMNS: DataTableColumnDef[] = [
  { key: 'ownerName', header: 'OwnerName', widthCh: 24 },
  { key: 'allPlayWins', header: 'All Play Wins', widthCh: 12, defaultSort: true, format: 'integer' },
  { key: 'allPlayLosses', header: 'All Play Loss', widthCh: 12, format: 'integer' },
  { key: 'allPlayWinPct', header: 'All Play Win%', widthCh: 12, format: 'percent2' },
];

@Component({
  selector: 'app-all-time-analytics-table',
  imports: [DataTableComponent],
  templateUrl: './analytics-table.html',
  styleUrl: './analytics-table.scss',
})
export class AnalyticsTable {
  private readonly allPlayMatrix = inject(AllTimeAllPlayMatrixService);

  private ownerLabel(value: string): string {
    const match = value.match(/^(.*)\s\((\d+)\)$/);
    return match ? match[1] : value;
  }

  protected readonly tableState = computed(() => {
    const matrix = this.allPlayMatrix.buildMatrix();
    if (!matrix) return { columns: ALL_TIME_ANALYTICS_COLUMNS, data: [] as AllTimeAnalyticsTableRow[] };

    const data: AllTimeAnalyticsTableRow[] = matrix.teamNames.map((ownerDisplay) => {
      const total = matrix.getTotalRecord(ownerDisplay);
      const totalGames = total.wins + total.losses + total.ties;
      const winPct = totalGames > 0 ? ((total.wins + 0.5 * total.ties) / totalGames) * 100 : 0;

      return {
        ownerName: this.ownerLabel(ownerDisplay),
        allPlayWins: total.wins,
        allPlayLosses: total.losses,
        allPlayWinPct: winPct,
      };
    });

    return { columns: ALL_TIME_ANALYTICS_COLUMNS, data };
  });
}
