import { Component, computed, input } from '@angular/core';

import type { SeasonStandings } from '../../../models/season-standings.model';
import { mapSeasonStandingsToPreviewRows } from './standings-preview.mapper';
import { buildStandingsColumns } from './standings-columns';
import { DataTableComponent } from '../../../shared/table/data-table.component';
import type { DataTableRow } from '../../../shared/table/table.models';

@Component({
  selector: 'app-standings-preview',
  imports: [DataTableComponent],
  templateUrl: './standings-preview.component.html',
  styleUrl: './standings-preview.component.scss',
})
export class StandingsPreviewComponent {
  /** Current season standings to display. When null, table is empty. */
  readonly standings = input<SeasonStandings | null>(null);

  readonly tableState = computed(() => {
    const s = this.standings();
    if (!s) return { columns: [], data: [] as DataTableRow[] };
    const { rows, showPlayoffRank, showRegularSeasonRank } =
      mapSeasonStandingsToPreviewRows(s);
    return {
      data: rows as unknown as DataTableRow[],
      columns: buildStandingsColumns(showPlayoffRank, showRegularSeasonRank),
    };
  });

  /** Data for the table (typed for the data-table input). */
  readonly tableData = computed(() => this.tableState().data);
}
