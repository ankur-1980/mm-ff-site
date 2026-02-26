import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { SeasonStandingsDataService } from '../../../../data/season-standings-data.service';
import { DataTableComponent } from '../../../../shared/table';
import type { DataTableColumnDef, DataTableRow } from '../../../../shared/table';
import { SeasonStandingsService } from '../../season-standings/season-standings.service';
import type { SeasonStandingsRow } from '../../season-standings/season-standings.models';

export interface AnalyticsTableRow extends DataTableRow {
  teamName: string;
  managerName: string;
  pointsFor: number;
  pointsAgainst: number;
  pointsForAvg: number;
  pointsAgainstAvg: number;
}

const ANALYTICS_COLUMNS: DataTableColumnDef[] = [
  { key: 'teamName', header: 'Team', widthCh: 24, subscriptKey: 'managerName' },
  {
    key: 'pointsFor',
    header: 'Points For',
    widthCh: 12,
    format: 'decimal2',
    defaultSort: true,
  },
  { key: 'pointsAgainst', header: 'Points Against', widthCh: 14, format: 'decimal2' },
  { key: 'pointsForAvg', header: 'PF Avg', widthCh: 10, format: 'decimal2' },
  { key: 'pointsAgainstAvg', header: 'PA Avg', widthCh: 10, format: 'decimal2' },
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

  /** Year is on the :year route (parent of analytics). */
  private readonly year = toSignal(
    (this.route.parent?.parent ?? this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null))
    ),
    { initialValue: null }
  );

  private readonly standings = computed(() => {
    const y = this.year();
    if (y == null) return null;
    return this.seasonStandingsData.getStandingsForSeason(String(y));
  });

  protected readonly tableState = computed(() => {
    const state = this.seasonStandings.toTableState(this.standings());
    const rows = state.data.map((row: SeasonStandingsRow): AnalyticsTableRow => {
      const gp = row.gp ?? 0;
      return {
        teamName: row.teamName,
        managerName: row.managerName,
        pointsFor: row.pointsFor,
        pointsAgainst: row.pointsAgainst,
        pointsForAvg: gp > 0 ? row.pointsFor / gp : 0,
        pointsAgainstAvg: gp > 0 ? row.pointsAgainst / gp : 0,
      };
    });
    return { columns: ANALYTICS_COLUMNS, data: rows };
  });
}
