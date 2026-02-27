import { inject, Injectable } from '@angular/core';

import { SeasonStandingsDataService } from '../../../../data/season-standings-data.service';
import { PythagoreanRankingsService } from '../../../season/season-power-rankings/pythagorean-rankings.service';

export interface CareerExpectedActualPoint {
  ownerName: string;
  expectedWins: number;
  actualWins: number;
  careerLuck: number;
}

export interface CareerExpectedActualResult {
  points: CareerExpectedActualPoint[];
  axisMin: number;
  axisMax: number;
}

@Injectable({ providedIn: 'root' })
export class ExpectedWinsVsActualWinsService {
  private readonly standingsData = inject(SeasonStandingsDataService);
  private readonly pythagorean = inject(PythagoreanRankingsService);

  buildCareerData(): CareerExpectedActualResult | null {
    const totals = new Map<string, { expectedWins: number; actualWins: number }>();

    for (const seasonId of this.standingsData.seasonIds()) {
      const standings = this.standingsData.getStandingsForSeason(seasonId);
      if (!standings) continue;

      for (const entry of Object.values(standings)) {
        const ownerName = entry.playerDetails?.managerName;
        if (!ownerName) continue;

        const wins = Number(entry.record?.win ?? 0);
        const losses = Number(entry.record?.loss ?? 0);
        const ties = Number(entry.record?.tie ?? 0);
        const pointsFor = Number(entry.points?.pointsFor ?? 0);
        const pointsAgainst = Number(entry.points?.pointsAgainst ?? 0);
        const gamesPlayed = wins + losses + ties;
        const expectedWins = this.pythagorean.calculateExpectedWins(
          pointsFor,
          pointsAgainst,
          gamesPlayed
        );

        const current = totals.get(ownerName) ?? { expectedWins: 0, actualWins: 0 };
        current.expectedWins += expectedWins;
        current.actualWins += wins;
        totals.set(ownerName, current);
      }
    }

    const points = Array.from(totals.entries())
      .map(([ownerName, values]) => ({
        ownerName,
        expectedWins: values.expectedWins,
        actualWins: values.actualWins,
        careerLuck: values.actualWins - values.expectedWins,
      }))
      .sort((a, b) => a.ownerName.localeCompare(b.ownerName));

    if (!points.length) return null;

    const allValues = points.flatMap((point) => [point.expectedWins, point.actualWins]);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = Math.max(2, Math.ceil((maxValue - minValue) * 0.05));

    return {
      points,
      axisMin: Math.max(0, Math.floor(minValue - padding)),
      axisMax: Math.ceil(maxValue + padding),
    };
  }
}
