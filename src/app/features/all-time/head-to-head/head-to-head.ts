import { Component, computed, inject } from '@angular/core';

import { DataTableComponent } from '../../../shared/table';
import type { DataTableColumnDef, DataTableRow } from '../../../shared/table';
import type { AllPlayPairRecord } from '../../season/season-analytics/models/all-play-matrix.models';
import { HeadToHeadMatrixService } from './head-to-head-matrix.service';

interface HeadToHeadSummaryRow extends DataTableRow {
  ownerName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
}

const SUMMARY_COLUMNS: DataTableColumnDef[] = [
  { key: 'ownerName', header: 'OwnerName', widthCh: 24 },
  { key: 'gamesPlayed', header: 'Games Played', widthCh: 12, format: 'integer' },
  { key: 'wins', header: 'Win', widthCh: 8, defaultSort: true, format: 'integer' },
  { key: 'losses', header: 'Loss', widthCh: 8, format: 'integer' },
  { key: 'ties', header: 'Tie', widthCh: 8, format: 'integer' },
  { key: 'winPct', header: 'Win%', widthCh: 10, format: 'percent2' },
];

@Component({
  selector: 'app-head-to-head',
  imports: [DataTableComponent],
  templateUrl: './head-to-head.html',
  styleUrl: './head-to-head.scss',
})
export class HeadToHead {
  private readonly matrixService = inject(HeadToHeadMatrixService);

  protected readonly matrix = computed(() => this.matrixService.buildMatrix());

  protected readonly summaryTableState = computed(() => {
    const data = this.matrix();
    if (!data) return { columns: SUMMARY_COLUMNS, data: [] as HeadToHeadSummaryRow[] };

    const rows: HeadToHeadSummaryRow[] = data.teamNames.map((ownerName) => {
      const total = data.getTotalRecord(ownerName);
      const gamesPlayed = total.wins + total.losses + total.ties;
      const winPct = gamesPlayed > 0 ? ((total.wins + 0.5 * total.ties) / gamesPlayed) * 100 : 0;

      return {
        ownerName,
        gamesPlayed,
        wins: total.wins,
        losses: total.losses,
        ties: total.ties,
        winPct,
      };
    });

    return { columns: SUMMARY_COLUMNS, data: rows };
  });

  protected formatRecord(record: AllPlayPairRecord): string {
    if (record.wins === 0 && record.losses === 0 && record.ties === 0) return '--';
    return `${record.wins}-${record.losses}-${record.ties}`;
  }

  protected formatWinPct(record: AllPlayPairRecord): string {
    const games = record.wins + record.losses + record.ties;
    if (games === 0) return '--';
    const pct = ((record.wins + 0.5 * record.ties) / games) * 100;
    return `${pct.toFixed(2)}%`;
  }
}
