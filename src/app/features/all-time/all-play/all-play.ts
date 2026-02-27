import { Component, computed, inject } from '@angular/core';

import { AllPlayMatrix } from '../../season/season-analytics/all-play-matrix/all-play-matrix';
import { AllTimeAllPlayMatrixService } from './all-play-matrix.service';
import { DataTableComponent } from '../../../shared/table';
import type { DataTableColumnDef, DataTableRow } from '../../../shared/table';
import { AnalyticsAllPlayCareerRecord } from '../analytics/analytics-all-play-career-record/analytics-all-play-career-record';

interface AllPlayTableRow extends DataTableRow {
  ownerName: string;
  seasonsActive: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
}

const ALL_PLAY_COLUMNS: DataTableColumnDef[] = [
  { key: 'ownerName', header: 'OwnerName', widthCh: 24 },
  { key: 'seasonsActive', header: 'Seasons Active', widthCh: 12, format: 'integer' },
  { key: 'gamesPlayed', header: 'Games Played', widthCh: 12, format: 'integer' },
  { key: 'wins', header: 'Win', widthCh: 8, defaultSort: true, format: 'integer' },
  { key: 'losses', header: 'Loss', widthCh: 8, format: 'integer' },
  { key: 'ties', header: 'Tie', widthCh: 8, format: 'integer' },
  { key: 'winPct', header: 'Win%', widthCh: 10, format: 'percent2' },
];

@Component({
  selector: 'app-all-play',
  imports: [AllPlayMatrix, DataTableComponent, AnalyticsAllPlayCareerRecord],
  templateUrl: './all-play.html',
  styleUrl: './all-play.scss',
})
export class AllPlay {
  private readonly allPlayMatrixService = inject(AllTimeAllPlayMatrixService);

  protected readonly matrix = computed(() => this.allPlayMatrixService.buildMatrix());

  private splitOwnerDisplay(value: string): { ownerName: string; seasonsActive: number } {
    const match = value.match(/^(.*)\s\((\d+)\)$/);
    return {
      ownerName: match ? match[1] : value,
      seasonsActive: match ? Number(match[2]) : 0,
    };
  }

  protected readonly tableState = computed(() => {
    const matrix = this.matrix();
    if (!matrix) return { columns: ALL_PLAY_COLUMNS, data: [] as AllPlayTableRow[] };

    const data: AllPlayTableRow[] = matrix.teamNames.map((ownerDisplay) => {
      const { ownerName, seasonsActive } = this.splitOwnerDisplay(ownerDisplay);
      const total = matrix.getTotalRecord(ownerDisplay);
      const gamesPlayed = total.wins + total.losses + total.ties;
      const winPct = gamesPlayed > 0 ? ((total.wins + 0.5 * total.ties) / gamesPlayed) * 100 : 0;

      return {
        ownerName,
        seasonsActive,
        gamesPlayed,
        wins: total.wins,
        losses: total.losses,
        ties: total.ties,
        winPct,
      };
    });

    return { columns: ALL_PLAY_COLUMNS, data };
  });
}
