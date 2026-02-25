import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { DataTableComponent } from '../../../shared/table';
import { FeatureBanner } from '../../../shared/components/feature-banner/feature-banner';
import { ChampionBannerService } from './champion-banner.service';
import { SeasonStandingsService } from './season-standings.service';
import { ToiletBowlBannerService } from './toilet-bowl-banner.service';

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
  private readonly championBanner = inject(ChampionBannerService);
  private readonly toiletBowlBanner = inject(ToiletBowlBannerService);

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
    return y != null ? this.championBanner.getChampionData(String(y)) : null;
  });

  protected readonly toiletBowlData = computed(() => {
    const y = this.year();
    return y != null ? this.toiletBowlBanner.getToiletBowlData(String(y)) : null;
  });
}
