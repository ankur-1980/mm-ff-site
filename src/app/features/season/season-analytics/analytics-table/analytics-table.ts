import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { SeasonStandingsDataService } from '../../../../data/season-standings-data.service';
import { DataTableComponent } from '../../../../shared/table';
import type { DataTableColumnDef, DataTableRow } from '../../../../shared/table';
import { SeasonStandingsService } from '../../season-standings/season-standings.service';
import type { SeasonStandingsRow } from '../../season-standings/season-standings.models';
import { PythagoreanRankingsService } from '../../season-power-rankings/pythagorean-rankings.service';
import { AllPlayMatrixService } from '../services/all-play-matrix.service';

function formatAllPlayRecord(w: number, l: number, t: number): string {
  if (w === 0 && l === 0 && t === 0) return '—';
  return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
}

export interface AnalyticsTableRow extends DataTableRow {
  teamName: string;
  managerName: string;
  allPlayRecord: string;
  allPlayRecordSortValue: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsForAvg: number;
  pointsAgainstAvg: number;
  pythagoreanWins: number;
  luckScore: number;
}

const ANALYTICS_COLUMNS: DataTableColumnDef[] = [
  { key: 'teamName', header: 'Team', widthCh: 24, subscriptKey: 'managerName' },
  { key: 'allPlayRecord', header: 'All-Play', widthCh: 12, defaultSort: true },
  {
    key: 'pointsFor',
    header: 'Points For',
    widthCh: 12,
    format: 'decimal2',
  },
  { key: 'pointsAgainst', header: 'Points Against', widthCh: 14, format: 'decimal2' },
  { key: 'pointsForAvg', header: 'PF Avg', widthCh: 10, format: 'decimal2' },
  { key: 'pointsAgainstAvg', header: 'PA Avg', widthCh: 10, format: 'decimal2' },
  {
    key: 'pythagoreanWins',
    header: 'PE Wins',
    widthCh: 10,
    format: 'decimal2',
  },
  {
    key: 'luckScore',
    header: 'Luck Score',
    widthCh: 12,
    format: 'signedDecimal2',
  },
];

@Component({
  selector: 'app-analytics-table',
  standalone: true,
  imports: [DataTableComponent],
  templateUrl: './analytics-table.html',
  styleUrl: './analytics-table.scss',
})
export class AnalyticsTable {
  private readonly route = inject(ActivatedRoute);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly seasonStandings = inject(SeasonStandingsService);
  private readonly pythagorean = inject(PythagoreanRankingsService);
  private readonly allPlayMatrixService = inject(AllPlayMatrixService);

  /** Year is on the :year route (parent of analytics). */
  private readonly year = toSignal(
    (this.route.parent?.parent ?? this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null)),
    ),
    { initialValue: null },
  );

  private readonly standings = computed(() => {
    const y = this.year();
    if (y == null) return null;
    return this.seasonStandingsData.getStandingsForSeason(String(y));
  });

  protected readonly tableState = computed(() => {
    const y = this.year();
    const state = this.seasonStandings.toTableState(this.standings());
    const matrix = y != null ? this.allPlayMatrixService.buildMatrix(String(y)) : null;
    const rows = state.data.map((row: SeasonStandingsRow): AnalyticsTableRow => {
      const gp = row.gp ?? 0;
      const expectedWins =
        gp > 0 ? this.pythagorean.calculateExpectedWins(row.pointsFor, row.pointsAgainst, gp) : 0;
      const actualWins = row.win ?? 0;
      const luckScore = actualWins - expectedWins;
      const totalRecord = matrix?.getTotalRecord(row.teamName);
      const allPlayWins = totalRecord?.wins ?? 0;
      const allPlayRecord =
        totalRecord != null
          ? formatAllPlayRecord(totalRecord.wins, totalRecord.losses, totalRecord.ties)
          : '—';
      return {
        teamName: row.teamName,
        managerName: row.managerName,
        allPlayRecord,
        allPlayRecordSortValue: allPlayWins,
        pointsFor: row.pointsFor,
        pointsAgainst: row.pointsAgainst,
        pointsForAvg: gp > 0 ? row.pointsFor / gp : 0,
        pointsAgainstAvg: gp > 0 ? row.pointsAgainst / gp : 0,
        pythagoreanWins: expectedWins,
        luckScore,
      };
    });
    return { columns: ANALYTICS_COLUMNS, data: rows };
  });
}
