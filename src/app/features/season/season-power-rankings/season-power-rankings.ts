import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { DataTableComponent } from '../../../shared/table';
import { SeasonPowerRankingsService } from './season-power-rankings.service';

@Component({
  selector: 'app-season-power-rankings',
  imports: [DataTableComponent],
  templateUrl: './season-power-rankings.html',
  styleUrl: './season-power-rankings.scss',
})
export class SeasonPowerRankings {
  private readonly route = inject(ActivatedRoute);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly seasonPowerRankings = inject(SeasonPowerRankingsService);

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

  protected readonly tableState = computed(() =>
    this.seasonPowerRankings.toTableState(this.standings())
  );
}
