import { Component, effect, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { LeagueMetaDataService } from '../../data/league-metadata.service';
import { WeeklyMatchupsDataService } from '../../data/weekly-matchups-data.service';
import { SectionHeader } from '../../shared/components/section-header/section-header';

interface AllTimeTab {
  path: string;
  label: string;
}

const ALL_TIME_TABS: AllTimeTab[] = [
  { path: 'records', label: 'Records' },
  { path: 'head-to-head', label: 'Head-To-Head' },
  { path: 'all-play', label: 'All-Play' },
  { path: 'awards', label: 'Awards' },
  { path: 'analytics', label: 'Analytics' },
];

@Component({
  selector: 'app-all-time-page',
  imports: [SectionHeader, RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
  templateUrl: './all-time.page.html',
  styleUrl: './all-time.page.scss',
})
export class AllTimePage {
  private readonly leagueMeta = inject(LeagueMetaDataService);
  private readonly weeklyMatchupsData = inject(WeeklyMatchupsDataService);

  protected readonly tabs = ALL_TIME_TABS;

  constructor() {
    effect(() => {
      const seasonIds = Object.keys(this.leagueMeta.seasons());
      if (seasonIds.length === 0) return;
      this.weeklyMatchupsData.loadSeasons(seasonIds);
    });
  }
}
