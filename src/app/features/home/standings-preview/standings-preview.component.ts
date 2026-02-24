import { Component, computed, input } from '@angular/core';

import type { SeasonStandings } from '../../../models/season-standings.model';
import { mapSeasonStandingsToPreviewRows } from './standings-preview.mapper';
import { buildStandingsColumns } from './standings-columns';
import { DataTableComponent } from '../../../shared/table';
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
    if (!s) return { columns: [] as ReturnType<typeof buildStandingsColumns>, data: [] as DataTableRow[] };
    const { rows, showPlayoffRank, showRegularSeasonRank } =
      mapSeasonStandingsToPreviewRows(s);
    return {
      data: rows,
      columns: buildStandingsColumns(showPlayoffRank, showRegularSeasonRank),
    };
  });
}
