import { inject, Injectable } from '@angular/core';

import { LeagueMetaDataService } from '../../../../data/league-metadata.service';
import { WeeklyMatchupsDataService } from '../../../../data/weekly-matchups-data.service';

function normalizeKey(name: string): string {
  return name != null ? String(name).trim().toLowerCase() : '';
}

export interface TeamHighLowPoint {
  teamName: string;
  minPoints: number;
  maxPoints: number;
}

export interface TeamHighLowResult {
  points: TeamHighLowPoint[];
  axisMin: number;
  axisMax: number;
}

@Injectable({ providedIn: 'root' })
export class TeamHighLowPointsService {
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  buildTeamHighLowPoints(seasonId: string): TeamHighLowResult | null {
    const meta = this.leagueMeta.getSeasonMeta(seasonId);
    if (!meta) return null;

    const season = this.weeklyMatchups.getSeasonWeeks(seasonId);
    if (!season) return null;

    const allWeekKeys = this.weeklyMatchups.getWeekKeysForSeason(seasonId);
    const regularSeasonWeekKeys = allWeekKeys.filter((key) => {
      const num = parseInt(key.replace(/\D/g, ''), 10);
      return !Number.isNaN(num) && num >= 1 && num <= meta.regularSeasonEndWeek;
    });

    const teamBounds = new Map<string, TeamHighLowPoint>();

    for (const weekKey of regularSeasonWeekKeys) {
      const weekData = season[weekKey];
      if (!weekData) continue;

      for (const entry of Object.values(weekData)) {
        const teamName = entry?.matchup?.team1Name;
        if (teamName == null || String(teamName).trim() === '') continue;

        const points = Number(entry?.team1Totals?.totalPoints ?? 0);
        if (!Number.isFinite(points)) continue;

        const displayName = String(teamName).trim();
        const key = normalizeKey(displayName);
        const existing = teamBounds.get(key);

        if (!existing) {
          teamBounds.set(key, {
            teamName: displayName,
            minPoints: points,
            maxPoints: points,
          });
          continue;
        }

        existing.minPoints = Math.min(existing.minPoints, points);
        existing.maxPoints = Math.max(existing.maxPoints, points);
      }
    }

    if (teamBounds.size === 0) return null;

    const points = Array.from(teamBounds.values()).sort((a, b) =>
      a.teamName.localeCompare(b.teamName),
    );

    const low = Math.min(...points.map((point) => point.minPoints));
    const high = Math.max(...points.map((point) => point.maxPoints));
    const axisMin = Math.max(0, Math.floor((low - 5) / 5) * 5);
    const axisMax = Math.ceil((high + 5) / 5) * 5;

    return { points, axisMin, axisMax };
  }
}
