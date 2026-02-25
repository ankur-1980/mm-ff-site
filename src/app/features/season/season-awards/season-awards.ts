import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { SubsectionHeader } from '../../../shared/components/subsection-header/subsection-header';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { StatValue } from '../../../shared/components/stat-card/stat-value/stat-value';
import { SeasonStandingsService } from '../season-standings/season-standings.service';

interface BestRecordAward {
  record: string;
  winPct: string;
  footer: string;
}

@Component({
  selector: 'app-season-awards',
  imports: [SubsectionHeader, StatCard, StatValue],
  templateUrl: './season-awards.html',
  styleUrl: './season-awards.scss',
})
export class SeasonAwards {
  private readonly route = inject(ActivatedRoute);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly seasonStandings = inject(SeasonStandingsService);

  private readonly year = toSignal(
    (this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null))
    ),
    { initialValue: null }
  );

  private readonly standings = computed(() => {
    const y = this.year();
    if (y == null) return null;
    return this.seasonStandingsData.getStandingsForSeason(String(y));
  });

  private readonly rows = computed(() =>
    this.seasonStandings.toTableState(this.standings()).data
  );

  protected readonly bestRecordAward = computed<BestRecordAward | null>(() => {
    const rows = this.rows();
    if (!rows.length) return null;

    const topWinPct = Math.max(...rows.map((row) => row.winPct));
    const tiedRows = rows.filter((row) => Math.abs(row.winPct - topWinPct) < 0.000001);

    const displayRow = tiedRows.reduce((currentBest, row) => {
      if (row.win !== currentBest.win) {
        return row.win > currentBest.win ? row : currentBest;
      }
      return row.pointsFor > currentBest.pointsFor ? row : currentBest;
    });

    const record =
      displayRow.tie > 0
        ? `${displayRow.win}-${displayRow.loss}-${displayRow.tie}`
        : `${displayRow.win}-${displayRow.loss}`;

    const footer = tiedRows
      .map((row) => `${row.teamName} - ${row.managerName}`)
      .join(' | ');

    return {
      record,
      winPct: `${topWinPct.toFixed(2)}%`,
      footer,
    };
  });
}
