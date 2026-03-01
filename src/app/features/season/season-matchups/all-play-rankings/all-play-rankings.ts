import { Component, computed, input } from '@angular/core';

import type { AllPlayEntry } from '../weekly-stats.models';
import {
  DataTableComponent,
  type DataTableColumnDef,
  type DataTableRow,
} from '../../../../shared/table';

interface AllPlayRankingRow extends DataTableRow {
  rank: number;
  teamName: string;
  ownerName: string;
  totalPoints: number;
  record: string;
}

const ALL_PLAY_COLUMNS: DataTableColumnDef[] = [
  { key: 'rank', header: '#', widthCh: 4, align: 'center', format: 'integer', defaultSort: true },
  { key: 'teamName', header: 'Team', widthCh: 24, subscriptKey: 'ownerName', dividerAfter: true },
  { key: 'totalPoints', header: 'Pts', widthCh: 10, format: 'decimal2' },
  { key: 'record', header: 'Record', widthCh: 10, dividerAfter: true },
];

@Component({
  selector: 'app-all-play-rankings',
  imports: [DataTableComponent],
  templateUrl: './all-play-rankings.html',
  styleUrl: './all-play-rankings.scss',
})
export class AllPlayRankings {
  readonly rankings = input<AllPlayEntry[]>([]);
  protected readonly columns = ALL_PLAY_COLUMNS;
  protected readonly rows = computed<AllPlayRankingRow[]>(() =>
    this.rankings().map((entry, index) => ({
      rank: index + 1,
      teamName: entry.teamName,
      ownerName: entry.ownerName,
      totalPoints: entry.totalPoints,
      record: this.formatRecord(entry),
    })),
  );

  protected formatRecord(entry: AllPlayEntry): string {
    return entry.ties > 0
      ? `${entry.wins}-${entry.losses}-${entry.ties}`
      : `${entry.wins}-${entry.losses}`;
  }
}
