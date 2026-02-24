import { DecimalPipe } from '@angular/common';
import {
  Component,
  effect,
  input,
  signal
} from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';

import type { SeasonStandings } from '../../../models/season-standings.model';
import {
  mapSeasonStandingsToPreviewRows,
  type StandingsPreviewRow
} from './standings-preview.mapper';

const BASE_COLUMNS = [
  'managerName',
  'teamName',
  'win',
  'loss',
  'tie',
  'winPct',
  'pointsFor',
  'pointsAgainst',
  'pointsDiff',
  'moves',
  'trades'
] as const;

function buildDisplayedColumns(
  showPlayoffRank: boolean,
  showRegularSeasonRank: boolean
): string[] {
  const cols: string[] = [];
  if (showPlayoffRank) cols.push('playoffRank');
  cols.push(...BASE_COLUMNS);
  if (showRegularSeasonRank) cols.push('regularSeasonRank');
  return cols;
}

@Component({
  selector: 'app-standings-preview',
  imports: [MatTableModule, DecimalPipe],
  templateUrl: './standings-preview.component.html',
  styleUrl: './standings-preview.component.scss'
})
export class StandingsPreviewComponent {
  /** Current season standings to display. When null, table is empty. */
  readonly standings = input<SeasonStandings | null>(null);

  readonly dataSource = new MatTableDataSource<StandingsPreviewRow>([]);
  readonly displayedColumns = signal<string[]>([]);

  constructor() {
    effect(() => {
      const s = this.standings();
      if (!s) {
        this.dataSource.data = [];
        this.displayedColumns.set([]);
        return;
      }
      const { rows, showPlayoffRank, showRegularSeasonRank } =
        mapSeasonStandingsToPreviewRows(s);
      this.dataSource.data = rows;
      this.displayedColumns.set(
        buildDisplayedColumns(showPlayoffRank, showRegularSeasonRank)
      );
    });
  }
}
