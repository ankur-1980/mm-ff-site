import { computed, inject, Injectable } from '@angular/core';

import { OwnersDataService } from '../../../data/owners-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import { buildOwnerIndex } from './weekly-matchups.mapper';
import { SeasonMatchupsService } from './season-matchups.service';
import { toWeekStats } from './weekly-stats.mapper';
import type { WeekStats } from './weekly-stats.models';

@Injectable({ providedIn: 'root' })
export class WeeklyStatsService {
  private readonly seasonMatchupsService = inject(SeasonMatchupsService);
  private readonly weeklyMatchupsData = inject(WeeklyMatchupsDataService);
  private readonly ownersData = inject(OwnersDataService);

  private readonly ownerIndex = computed(() => {
    const owners = this.ownersData.ownersData();
    return owners ? buildOwnerIndex(owners) : new Map<string, string>();
  });

  /**
   * Returns aggregated stats for the given season and week key (e.g. "week3").
   * Team stats come from mapped matchups; player stats from the raw roster entries.
   */
  getWeekStats(seasonId: string, weekKey: string): WeekStats {
    const matchups = this.seasonMatchupsService.getWeekMatchups(seasonId, weekKey);
    const weekMatchups = this.weeklyMatchupsData.getMatchupsForWeek(seasonId, weekKey) ?? {};
    return toWeekStats(matchups, weekMatchups, this.ownerIndex());
  }
}
