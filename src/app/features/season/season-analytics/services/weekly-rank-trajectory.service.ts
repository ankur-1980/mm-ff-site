import { inject, Injectable } from '@angular/core';

import type { WeeklyRankTrajectoryResult } from '../models/weekly-rank-trajectory.models';
import { LeagueMetaDataService } from '../../../../data/league-metadata.service';
import { WeeklyMatchupsDataService } from '../../../../data/weekly-matchups-data.service';

function normalizeKey(name: string): string {
  return name != null ? String(name).trim().toLowerCase() : '';
}

/**
 * For each week, rank teams by that week's score (1 = highest).
 * Returns week numbers, team names, and per-team array of rank per week.
 */
@Injectable({ providedIn: 'root' })
export class WeeklyRankTrajectoryService {
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  buildTrajectory(seasonId: string): WeeklyRankTrajectoryResult | null {
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
    const rankByTeam = new Map<string, (number | null)[]>();

    let weekIndex = 0;
    for (const weekKey of regularSeasonWeekKeys) {
      const weekData = season[weekKey];
      if (!weekData) continue;

      const entries: { key: string; points: number }[] = [];
      for (const entry of Object.values(weekData)) {
        const name = entry?.matchup?.team1Name;
        if (name == null || String(name).trim() === '') continue;
        const points = entry?.team1Totals?.totalPoints ?? 0;
        const key = normalizeKey(name);
        entries.push({ key, points });
      }

      entries.sort((a, b) => b.points - a.points);

      const rankByKey = new Map<string, number>();
      for (let i = 0; i < entries.length; i++) {
        const rank =
          i > 0 && entries[i].points === entries[i - 1].points
            ? rankByKey.get(entries[i - 1].key)!
            : i + 1;
        rankByKey.set(entries[i].key, rank);
      }

      for (const key of allTeamKeys) {
        const name = teamDisplayNames.get(key)!;
        let arr = rankByTeam.get(name);
        if (!arr) {
          arr = [];
          rankByTeam.set(name, arr);
        }
        while (arr.length < weekIndex) arr.push(null);
        arr.push(rankByKey.get(key) ?? null);
      }
      weekIndex += 1;
    }

    for (const [, arr] of rankByTeam) {
      while (arr.length < weekNumbers.length) arr.push(null);
    }

    const teamNames = Array.from(teamDisplayNames.values());
    return {
      weekNumbers,
      teamNames,
      rankByTeam,
    };
  }
}
