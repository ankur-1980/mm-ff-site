import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { map } from 'rxjs/operators';

import { LeagueMetaDataService } from '../../data/league-metadata.service';
import { SeasonSelector } from './season-selector/season-selector';

@Component({
  selector: 'app-season-page',
  imports: [SeasonSelector, RouterOutlet],
  templateUrl: './season.page.html',
  styleUrl: './season.page.scss'
})
export class SeasonPage {
  private readonly route = inject(ActivatedRoute);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  /** Year parsed from the route param `:year`. Reacts to navigation between seasons. */
  protected readonly year = toSignal(
    this.route.params.pipe(map((p) => (p['year'] ? Number(p['year']) : null))),
    { initialValue: null }
  );

  private readonly seasonMeta = computed(() => {
    const y = this.year();
    return y != null ? this.leagueMeta.getSeasonMeta(y) : null;
  });

  /** "Weeks 1–15" (or whatever regularSeasonEndWeek is for this year). */
  protected readonly regularSeasonLabel = computed(() => {
    const m = this.seasonMeta();
    return m ? `${m.regularSeasonEndWeek}` : '—';
  });

  /** "Weeks 16 & 17" derived from regularSeasonEndWeek + 1 through seasonEndWeek. */
  protected readonly playoffLabel = computed(() => {
    const m = this.seasonMeta();
    if (!m) return '—';
    const start = m.regularSeasonEndWeek + 1;
    const end = m.seasonEndWeek;
    if (start > end) return '—';
    if (start === end) return `Week ${start}`;
    return `Weeks ${start} & ${end}`;
  });
}
