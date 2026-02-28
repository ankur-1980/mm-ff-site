import { computed, inject, Injectable } from '@angular/core';

import { OwnersDataService } from '../../../data/owners-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import type { MappedMatchup } from '../../../models/matchup.model';
import { buildOwnerIndex, toMappedMatchups } from './weekly-matchups.mapper';

@Injectable({ providedIn: 'root' })
export class SeasonMatchupsService {
  private readonly weeklyMatchupsData = inject(WeeklyMatchupsDataService);
  private readonly ownersData = inject(OwnersDataService);

  /**
   * Owner index built once when owners data is loaded.
   * Maps every known team name -> manager name.
   */
  private readonly ownerIndex = computed(() => {
    const owners = this.ownersData.ownersData();
    return owners ? buildOwnerIndex(owners) : new Map<string, string>();
  });

  /**
   * Returns the mapped matchups for a given season and week key (e.g. "week3").
   * Returns an empty array when data is not yet loaded or the week is not found.
   */
  getWeekMatchups(seasonId: string, weekKey: string): MappedMatchup[] {
    const weekMatchups = this.weeklyMatchupsData.getMatchupsForWeek(seasonId, weekKey);
    if (!weekMatchups) return [];
    return toMappedMatchups(weekMatchups, this.ownerIndex());
  }
}
