import { inject, Injectable } from '@angular/core';

import type { BoxPlotTeamStats, WeekPoints } from '../models/points-distribution.models';
import { LeagueMetaDataService } from '../../../../data/league-metadata.service';
import { WeeklyMatchupsDataService } from '../../../../data/weekly-matchups-data.service';

function normalizeKey(name: string): string {
  return name != null ? String(name).trim().toLowerCase() : '';
}

/**
 * Linear interpolation percentile: r = (n-1)*p, quantile = x[lo] + (r - lo)*(x[hi] - x[lo]).
 * x is sorted ascending, 0-indexed.
 */
function percentile(sortedAsc: number[], p: number): number {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  if (n === 1) return sortedAsc[0];
  const r = (n - 1) * p;
  const lo = Math.floor(r);
  const hi = Math.ceil(r);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (r - lo) * (sortedAsc[hi] - sortedAsc[lo]);
}

@Injectable({ providedIn: 'root' })
export class PointsDistributionService {
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  /**
   * Build box plot stats per team for the regular season.
   * Teams sorted by median descending.
   */
  buildBoxPlotStats(seasonId: string): BoxPlotTeamStats[] | null {
    const meta = this.leagueMeta.getSeasonMeta(seasonId);
    if (!meta) return null;

    const season = this.weeklyMatchups.getSeasonWeeks(seasonId);
    if (!season) return null;

    const allWeekKeys = this.weeklyMatchups.getWeekKeysForSeason(seasonId);
    const regularSeasonWeekKeys = allWeekKeys.filter((key) => {
      const num = parseInt(key.replace(/\D/g, ''), 10);
      return !Number.isNaN(num) && num >= 1 && num <= meta.regularSeasonEndWeek;
    });

    const teamWeeklyPoints = new Map<string, WeekPoints[]>();
    const teamDisplayNames = new Map<string, string>();

    for (const weekKey of regularSeasonWeekKeys) {
      const weekData = season[weekKey];
      if (!weekData) continue;
      const weekNum = parseInt(weekKey.replace(/\D/g, ''), 10);

      for (const entry of Object.values(weekData)) {
        const name = entry?.matchup?.team1Name;
        if (name == null || String(name).trim() === '') continue;
        const points = entry?.team1Totals?.totalPoints ?? 0;
        const key = normalizeKey(name);
        const displayName = String(name).trim();
        if (!teamDisplayNames.has(key)) teamDisplayNames.set(key, displayName);
        let arr = teamWeeklyPoints.get(key);
        if (!arr) {
          arr = [];
          teamWeeklyPoints.set(key, arr);
        }
        arr.push({ week: weekNum, points });
      }
    }

    if (teamWeeklyPoints.size === 0) return null;

    const results: BoxPlotTeamStats[] = [];

    for (const [key, weekPoints] of teamWeeklyPoints) {
      const points = weekPoints.map((wp) => wp.points);
      const sorted = [...points].sort((a, b) => a - b);
      const n = sorted.length;
      if (n === 0) continue;

      const q1 = percentile(sorted, 0.25);
      const median = percentile(sorted, 0.5);
      const q3 = percentile(sorted, 0.75);
      const iqr = q3 - q1;
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;

      const outliers = weekPoints.filter((wp) => wp.points < lowerFence || wp.points > upperFence);
      const nonOutliers = weekPoints.filter(
        (wp) => wp.points >= lowerFence && wp.points <= upperFence,
      );

      const lowerWhisker =
        nonOutliers.length > 0 ? Math.min(...nonOutliers.map((wp) => wp.points)) : sorted[0];
      const upperWhisker =
        nonOutliers.length > 0 ? Math.max(...nonOutliers.map((wp) => wp.points)) : sorted[n - 1];

      results.push({
        teamName: teamDisplayNames.get(key)!,
        points: sorted,
        weekPoints,
        q1,
        median,
        q3,
        iqr,
        lowerFence,
        upperFence,
        lowerWhisker,
        upperWhisker,
        outliers,
      });
    }

    results.sort((a, b) => b.median - a.median);
    return results;
  }
}
