import { inject, Injectable } from '@angular/core';

import { LeagueMetaDataService } from '../../../../data/league-metadata.service';
import { WeeklyMatchupsDataService } from '../../../../data/weekly-matchups-data.service';

export interface SeasonHighLowPoint {
  season: number;
  minPoints: number;
  maxPoints: number;
}

export interface SeasonHighLowResult {
  points: SeasonHighLowPoint[];
  axisMin: number;
  axisMax: number;
}

@Injectable({ providedIn: 'root' })
export class SeasonHighLowPointsService {
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  buildRegularSeasonHighLow(): SeasonHighLowResult | null {
    const seasons = this.weeklyMatchups
      .seasonIds()
      .map((season) => Number(season))
      .sort((a, b) => a - b);

    const points: SeasonHighLowPoint[] = [];

    for (const season of seasons) {
      const seasonId = String(season);
      const meta = this.leagueMeta.getSeasonMeta(seasonId);
      const seasonWeeks = this.weeklyMatchups.getSeasonWeeks(seasonId);
      if (!meta || !seasonWeeks) continue;

      let minPoints = Number.POSITIVE_INFINITY;
      let maxPoints = Number.NEGATIVE_INFINITY;

      for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
        const weekData = seasonWeeks[`week${week}`];
        if (!weekData) continue;

        for (const entry of Object.values(weekData)) {
          const score = Number(entry.team1Totals?.totalPoints);
          if (!Number.isFinite(score)) continue;
          if (score < minPoints) minPoints = score;
          if (score > maxPoints) maxPoints = score;
        }
      }

      if (Number.isFinite(minPoints) && Number.isFinite(maxPoints)) {
        points.push({ season, minPoints, maxPoints });
      }
    }

    if (!points.length) return null;

    const low = Math.min(...points.map((point) => point.minPoints));
    const high = Math.max(...points.map((point) => point.maxPoints));
    const axisMin = Math.max(0, Math.floor((low - 5) / 5) * 5);
    const axisMax = Math.ceil((high + 5) / 5) * 5;

    return { points, axisMin, axisMax };
  }
}
