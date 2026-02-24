import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs/operators';
import { MatTabsModule } from '@angular/material/tabs';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';

export interface WeekItem {
  number: number;
  key: string;
  isPlayoff: boolean;
}

@Component({
  selector: 'app-season-matchups',
  imports: [RouterLink, RouterLinkActive, MatTabsModule],
  templateUrl: './season-matchups.html',
  styleUrl: './season-matchups.scss',
})
export class SeasonMatchups {
  private readonly route = inject(ActivatedRoute);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  protected readonly year = toSignal(
    (this.route.parent?.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? String(p['year']) : null))
    ),
    { initialValue: null }
  );

  private readonly seasonMeta = computed(() => {
    const year = this.year();
    return year ? this.leagueMeta.getSeasonMeta(year) : null;
  });

  protected readonly weeks = computed<WeekItem[]>(() => {
    const meta = this.seasonMeta();
    if (!meta) return [];
    return Array.from({ length: meta.seasonEndWeek }, (_, i) => ({
      number: i + 1,
      key: `week${i + 1}`,
      isPlayoff: i + 1 > meta.regularSeasonEndWeek,
    }));
  });
}

