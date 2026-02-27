import { inject, Injectable } from '@angular/core';
import { LoggerService } from '@ankur-1980/logger';

import { LeagueMetaDataService } from '../../../../data/league-metadata.service';
import { SeasonStandingsDataService } from '../../../../data/season-standings-data.service';
import { WeeklyMatchupsDataService } from '../../../../data/weekly-matchups-data.service';

export interface OwnerConsistencyIndex {
  ownerName: string;
  seasonsIncluded: number;
  averageSeasonIqr: number;
  averagePpgStdDev: number;
}

function normalize(value: string | null | undefined): string {
  return value != null ? String(value).trim().toLowerCase() : '';
}

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

function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / values.length;
  return Math.sqrt(variance);
}

@Injectable({ providedIn: 'root' })
export class ConsistencyIndexService {
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);
  private readonly seasonStandings = inject(SeasonStandingsDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);
  private readonly logger = inject(LoggerService);

  private readonly loggedMappingErrors = new Set<string>();

  private buildSeasonOwnerLookup(seasonId: string): Map<string, string> {
    const map = new Map<string, string>();
    const standings = this.seasonStandings.getStandingsForSeason(seasonId);
    if (!standings) return map;

    for (const entry of Object.values(standings)) {
      const teamName = normalize(entry.playerDetails?.teamName);
      const ownerName = entry.playerDetails?.managerName;
      if (!teamName || !ownerName) continue;
      map.set(teamName, ownerName);
    }

    return map;
  }

  buildCareerConsistencyIndex(): OwnerConsistencyIndex[] {
    const ownerSeasonMetrics = new Map<string, Array<{ iqr: number; stdDev: number }>>();

    for (const seasonId of this.weeklyMatchups.seasonIds()) {
      const meta = this.leagueMeta.getSeasonMeta(seasonId);
      const season = this.weeklyMatchups.getSeasonWeeks(seasonId);
      if (!meta || !season) continue;

      const ownerLookup = this.buildSeasonOwnerLookup(seasonId);
      const pointsByOwner = new Map<string, number[]>();

      for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
        const weekData = season[`week${week}`];
        if (!weekData) continue;

        for (const entry of Object.values(weekData)) {
          const teamName = entry.matchup?.team1Name;
          const ownerName = ownerLookup.get(normalize(teamName));
          if (!ownerName) {
            const key = `${seasonId}|${week}|${normalize(teamName)}`;
            if (!this.loggedMappingErrors.has(key)) {
              this.loggedMappingErrors.add(key);
              this.logger.error(
                `ConsistencyIndexService: could not map team "${teamName}" in season ${seasonId} week ${week}`
              );
            }
            continue;
          }

          const points = Number(entry.team1Totals?.totalPoints ?? 0);
          if (!Number.isFinite(points)) continue;

          const arr = pointsByOwner.get(ownerName) ?? [];
          arr.push(points);
          pointsByOwner.set(ownerName, arr);
        }
      }

      for (const [ownerName, points] of pointsByOwner.entries()) {
        if (points.length === 0) continue;
        const sorted = [...points].sort((a, b) => a - b);
        const q1 = percentile(sorted, 0.25);
        const q3 = percentile(sorted, 0.75);
        const iqr = q3 - q1;
        const stdDev = standardDeviation(points);

        const metrics = ownerSeasonMetrics.get(ownerName) ?? [];
        metrics.push({ iqr, stdDev });
        ownerSeasonMetrics.set(ownerName, metrics);
      }
    }

    return Array.from(ownerSeasonMetrics.entries())
      .map(([ownerName, seasons]) => {
        const seasonsIncluded = seasons.length;
        const averageSeasonIqr =
          seasons.reduce((sum, metric) => sum + metric.iqr, 0) / seasonsIncluded;
        const averagePpgStdDev =
          seasons.reduce((sum, metric) => sum + metric.stdDev, 0) / seasonsIncluded;
        return {
          ownerName,
          seasonsIncluded,
          averageSeasonIqr,
          averagePpgStdDev,
        };
      })
      .sort((a, b) => a.ownerName.localeCompare(b.ownerName));
  }
}
