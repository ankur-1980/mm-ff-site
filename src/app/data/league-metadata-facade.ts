import { computed, inject, Injectable } from '@angular/core';

import { LeagueMetaDataService } from './league-metadata.service';
import { OwnersDataService } from './owners-data.service';
import { SeasonStandingsDataService } from './season-standings-data.service';
import { WeeklyMatchupsDataService } from './weekly-matchups-data.service';

/** Resolved current season from meta + standings (id is the season year number). */
export interface CurrentSeason {
  id: number;
}

/**
 * Single entry point to load all league data at app init.
 * Components should still inject the individual data services (LeagueDataService, etc.)
 * for type-safe access; use this facade only to trigger load() on all of them.
 */
@Injectable({ providedIn: 'root' })
export class LeagueMetaDataFacade {
  private readonly league = inject(LeagueMetaDataService);
  private readonly owners = inject(OwnersDataService);
  private readonly seasonStandings = inject(SeasonStandingsDataService);
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);

  /** Load all data sources. Safe to call multiple times; each service guards its own load. */
  loadAll(): void {
    this.league.load();
    this.owners.load();
    this.seasonStandings.load();
    this.weeklyMatchups.load();
  }

  /** League load status (passthrough). */
  get loadStatus() {
    return this.league.loadStatus;
  }
  /** League load error (passthrough). */
  get loadError() {
    return this.league.loadError;
  }
  /** League meta data when loaded (passthrough). */
  get leagueData() {
    return this.league.leagueData;
  }

  /**
   * Current season resolved from meta currentSeasonId and standings.
   * null if meta/standings not loaded, currentSeasonId missing, or id not in standings.
   */
  readonly currentSeason = computed<CurrentSeason | null>(() => {
    const id = this.league.currentSeasonId();
    if (id == null) return null;
    const ids = this.seasonStandings.seasonIds();
    if (!ids.includes(id.toString())) return null;
    return { id };
  });
}
