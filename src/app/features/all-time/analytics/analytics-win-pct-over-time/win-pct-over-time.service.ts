import { inject, Injectable } from '@angular/core';

import { SeasonStandingsDataService } from '../../../../data/season-standings-data.service';

export interface CumulativeWinPctPoint {
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
  winPct: number;
}

export interface OwnerCumulativeWinPctSeries {
  ownerName: string;
  points: Array<CumulativeWinPctPoint | null>;
}

export interface WinPctOverTimeResult {
  seasons: number[];
  series: OwnerCumulativeWinPctSeries[];
}

@Injectable({ providedIn: 'root' })
export class WinPctOverTimeService {
  private readonly standingsData = inject(SeasonStandingsDataService);

  buildSeasonalWinPctSeries(): WinPctOverTimeResult | null {
    const seasons = this.standingsData
      .seasonIds()
      .map((season) => Number(season))
      .sort((a, b) => a - b);
    if (!seasons.length) return null;

    const ownerNames = new Set<string>();
    for (const season of seasons) {
      const standings = this.standingsData.getStandingsForSeason(String(season));
      if (!standings) continue;
      for (const entry of Object.values(standings)) {
        const ownerName = entry.playerDetails?.managerName;
        if (ownerName) ownerNames.add(ownerName);
      }
    }

    if (!ownerNames.size) return null;

    const sortedOwners = Array.from(ownerNames).sort((a, b) => a.localeCompare(b));
    const seriesByOwner = new Map<string, Array<CumulativeWinPctPoint | null>>();

    for (const ownerName of sortedOwners) {
      seriesByOwner.set(ownerName, Array.from({ length: seasons.length }, () => null));
    }

    seasons.forEach((season, seasonIndex) => {
      const standings = this.standingsData.getStandingsForSeason(String(season));
      if (!standings) return;

      for (const entry of Object.values(standings)) {
        const ownerName = entry.playerDetails?.managerName;
        if (!ownerName) continue;

        const wins = Number(entry.record?.win ?? 0);
        const losses = Number(entry.record?.loss ?? 0);
        const ties = Number(entry.record?.tie ?? 0);
        const gamesPlayed = wins + losses + ties;
        const winPct = gamesPlayed > 0 ? ((wins + 0.5 * ties) / gamesPlayed) * 100 : 0;

        const points = seriesByOwner.get(ownerName);
        if (!points) continue;

        points[seasonIndex] = {
          wins,
          losses,
          ties,
          gamesPlayed,
          winPct,
        };
      }
    });

    return {
      seasons,
      series: sortedOwners.map((ownerName) => ({
        ownerName,
        points: seriesByOwner.get(ownerName) ?? [],
      })),
    };
  }
}
