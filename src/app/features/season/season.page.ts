import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs/operators';
import { MatTabsModule } from '@angular/material/tabs';

import { LeagueMetaDataService } from '../../data/league-metadata.service';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { SeasonSelector } from './season-selector/season-selector';

interface SeasonTab {
  path: string;
  label: string;
}

const SEASON_TABS: SeasonTab[] = [
  { path: 'standings',      label: 'Standings' },
  { path: 'matchups',       label: 'Matchups' },
  { path: 'power-rankings', label: 'Power Rankings' },
  { path: 'awards',         label: 'Awards' },
  { path: 'analytics',      label: 'Analytics' },
  { path: 'draft',          label: 'Draft' },
];

@Component({
  selector: 'app-season-page',
  imports: [SectionHeader, SeasonSelector, RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
  templateUrl: './season.page.html',
  styleUrl: './season.page.scss'
})
export class SeasonPage {
  private readonly route = inject(ActivatedRoute);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  protected readonly tabs = SEASON_TABS;

  /** Year parsed from the route param `:year`. Reacts to navigation between seasons. */
  protected readonly year = toSignal(
    this.route.params.pipe(map((p) => (p['year'] ? Number(p['year']) : null))),
    { initialValue: null }
  );

  private readonly seasonMeta = computed(() => {
    const y = this.year();
    return y != null ? this.leagueMeta.getSeasonMeta(y) : null;
  });

  protected readonly headingLabel = computed(() => String(this.year() ?? '—'));

  protected readonly metaItems = computed<string[]>(() => {
    const m = this.seasonMeta();
    if (!m) return [];

    const regularEnd = m.regularSeasonEndWeek;
    const playoffStart = regularEnd + 1;
    const playoffEnd = m.seasonEndWeek;

    const regularLabel = `Regular season \u2013 Weeks 1\u2013${regularEnd}`;

    let playoffLabel: string;
    if (playoffStart > playoffEnd) {
      playoffLabel = 'Playoffs \u2013 \u2014';
    } else if (playoffStart === playoffEnd) {
      playoffLabel = `Playoffs \u2013 Week ${playoffStart}`;
    } else {
      playoffLabel = `Playoffs \u2013 Weeks ${playoffStart} & ${playoffEnd}`;
    }

    return [regularLabel, playoffLabel];
  });
}
