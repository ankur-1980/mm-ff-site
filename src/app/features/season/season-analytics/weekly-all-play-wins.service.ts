import { inject, Injectable } from '@angular/core';

import type { WeeklyAllPlayWinsResult } from './weekly-all-play-wins.models';
import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';

const EPSILON = 0.000_001;

function normalizeKey(name: string): string {
  return name != null ? String(name).trim().toLowerCase() : '';
}

/**
 * For each regular-season week, compute all-play wins per team (number of opponents
 * they outscored) and cumulative all-play wins through that week.
 */
@Injectable({ providedIn: 'root' })
export class WeeklyAllPlayWinsService {
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  buildWeeklyAllPlayWins(seasonId: string): WeeklyAllPlayWinsResult | null {
    const meta = this.leagueMeta.getSeasonMeta(seasonId);
    if (!meta) return null;

    const season = this.weeklyMatchups.getSeasonWeeks(seasonId);
    if (!season) return null;

    const allWeekKeys = this.weeklyMatchups.getWeekKeysForSeason(seasonId);
    const regularSeasonWeekKeys = allWeekKeys.filter((key) => {
      const num = parseInt(key.replace(/\D/g, ''), 10);
      return !Number.isNaN(num) && num >= 1 && num <= meta.regularSeasonEndWeek;
    });

    const weekNumbers: number[] = [];
    const teamDisplayNames = new Map<string, string>();

    for (const weekKey of regularSeasonWeekKeys) {
      const weekData = season[weekKey];
      if (!weekData) continue;
      const weekNum = parseInt(weekKey.replace(/\D/g, ''), 10);
      weekNumbers.push(weekNum);
      for (const entry of Object.values(weekData)) {
        const name = entry?.matchup?.team1Name;
        if (name == null || String(name).trim() === '') continue;
        const key = normalizeKey(name);
        if (!teamDisplayNames.has(key)) {
          teamDisplayNames.set(key, String(name).trim());
        }
      }
    }

    if (weekNumbers.length === 0) return null;

    const allTeamKeys = Array.from(teamDisplayNames.keys());
    const weeklyWinsByTeam = new Map<string, number[]>();
    const cumulativeByTeam = new Map<string, number[]>();

    for (const key of allTeamKeys) {
      const name = teamDisplayNames.get(key)!;
      weeklyWinsByTeam.set(name, []);
      cumulativeByTeam.set(name, []);
    }

    let cumulativeSoFar = new Map<string, number>();
    for (const key of allTeamKeys) {
      cumulativeSoFar.set(teamDisplayNames.get(key)!, 0);
    }

    for (const weekKey of regularSeasonWeekKeys) {
      const weekData = season[weekKey];
      if (!weekData) continue;

      const scoresByKey = new Map<string, number>();
      for (const entry of Object.values(weekData)) {
        const name = entry?.matchup?.team1Name;
        if (name == null || String(name).trim() === '') continue;
        const points = entry?.team1Totals?.totalPoints ?? 0;
        const key = normalizeKey(name);
        scoresByKey.set(key, points);
      }

      for (const key of allTeamKeys) {
        const name = teamDisplayNames.get(key)!;
        const score = scoresByKey.get(key) ?? 0;
        let wins = 0;
        for (const otherKey of allTeamKeys) {
          if (otherKey === key) continue;
          const otherScore = scoresByKey.get(otherKey) ?? 0;
          if (score - otherScore > EPSILON) wins += 1;
        }
        weeklyWinsByTeam.get(name)!.push(wins);
        const cum = (cumulativeSoFar.get(name) ?? 0) + wins;
        cumulativeSoFar.set(name, cum);
        cumulativeByTeam.get(name)!.push(cum);
      }
    }

    const teamNames = Array.from(teamDisplayNames.values());
    return {
      weekNumbers,
      teamNames,
      weeklyWinsByTeam,
      cumulativeByTeam,
    };
  }
}
