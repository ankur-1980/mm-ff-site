import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { DataTableComponent } from '../../../shared/table';
import { FeatureBanner } from '../../../shared/components/feature-banner/feature-banner';
import { SeasonBannerService } from './season-banner.service';
import { SeasonStandingsService } from './season-standings.service';

@Component({
  selector: 'app-season-standings',
  imports: [DataTableComponent, FeatureBanner],
  templateUrl: './season-standings.html',
  styleUrl: './season-standings.scss',
})
export class SeasonStandings {
  private readonly route = inject(ActivatedRoute);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly seasonStandings = inject(SeasonStandingsService);
  private readonly seasonBanner = inject(SeasonBannerService);

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
    this.seasonStandings.toTableState(this.standings())
  );

  protected readonly championData = computed(() => {
    const y = this.year();
    return y != null ? this.seasonBanner.getChampionData(String(y)) : null;
  });

  protected readonly toiletBowlData = computed(() => {
    const y = this.year();
    return y != null ? this.seasonBanner.getToiletBowlData(String(y)) : null;
  });

  protected readonly highScoreData = computed(() => {
    const rows = this.tableState().data;
    if (!rows.length) return null;
    const top = rows.reduce((best, row) =>
      row.pointsFor > best.pointsFor ? row : best
    );
    return {
      ownerName: top.managerName,
      teamName: top.teamName,
      score: top.pointsFor,
    };
  });
}
