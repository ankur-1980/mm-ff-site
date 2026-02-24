import { inject, Injectable } from '@angular/core';

import { OwnersDataService } from './owners-data.service';
import { SeasonStandingsDataService } from './season-standings-data.service';
import { WeeklyMatchupsDataService } from './weekly-matchups-data.service';

/**
 * Single entry point to load all league data at app init.
 * Components should still inject the individual data services (OwnersDataService, etc.)
 * for type-safe access; use this facade only to trigger load() on all of them.
 */
@Injectable({ providedIn: 'root' })
export class LeagueDataFacade {
  private readonly owners = inject(OwnersDataService);
  private readonly seasonStandings = inject(SeasonStandingsDataService);
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);

  /** Load all data sources. Safe to call multiple times; each service guards its own load. */
  loadAll(): void {
    this.owners.load();
    this.seasonStandings.load();
    this.weeklyMatchups.load();
  }
}
