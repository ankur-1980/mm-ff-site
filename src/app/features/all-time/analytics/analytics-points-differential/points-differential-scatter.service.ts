import { inject, Injectable } from '@angular/core';

import { SeasonStandingsDataService } from '../../../../data/season-standings-data.service';
import { PythagoreanRankingsService } from '../../../season/season-power-rankings/pythagorean-rankings.service';

export interface AllTimePfPaScatterPoint {
  x: number;
  y: number;
  ownerName: string;
  abbrev: string;
  totalPointsFor: number;
  totalPointsAgainst: number;
  expectedWins: number;
  actualWins: number;
  luck: number;
}

export interface AllTimePfPaScatterResult {
  points: AllTimePfPaScatterPoint[];
  avgPF: number;
  avgPA: number;
  axisMin: number;
  axisMax: number;
}

function ownerAbbrev(ownerName: string): string {
  const trimmed = ownerName.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 3).toUpperCase();
}

@Injectable({ providedIn: 'root' })
export class PointsDifferentialScatterService {
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly pythagorean = inject(PythagoreanRankingsService);

  buildCareerScatter(): AllTimePfPaScatterResult | null {
    const totals = new Map<
      string,
      { pointsFor: number; pointsAgainst: number; wins: number; losses: number; ties: number }
    >();

    for (const seasonId of this.seasonStandingsData.seasonIds()) {
      const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
      if (!standings) continue;

      for (const entry of Object.values(standings)) {
        const ownerName = entry.playerDetails?.managerName;
        if (!ownerName) continue;

        const wins = Number(entry.record?.win ?? 0);
        const losses = Number(entry.record?.loss ?? 0);
        const ties = Number(entry.record?.tie ?? 0);
        const pointsFor = Number(entry.points?.pointsFor ?? 0);
        const pointsAgainst = Number(entry.points?.pointsAgainst ?? 0);

        const current = totals.get(ownerName) ?? {
          pointsFor: 0,
          pointsAgainst: 0,
          wins: 0,
          losses: 0,
          ties: 0,
        };
        current.pointsFor += pointsFor;
        current.pointsAgainst += pointsAgainst;
        current.wins += wins;
        current.losses += losses;
        current.ties += ties;
        totals.set(ownerName, current);
      }
    }

    if (!totals.size) return null;

    let sumPF = 0;
    let sumPA = 0;
    const points = Array.from(totals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ownerName, totalsByOwner]) => {
        const gamesPlayed = totalsByOwner.wins + totalsByOwner.losses + totalsByOwner.ties;
        const expectedWins = this.pythagorean.calculateExpectedWins(
          totalsByOwner.pointsFor,
          totalsByOwner.pointsAgainst,
          gamesPlayed
        );
        const actualWins = totalsByOwner.wins;
        const luck = actualWins - expectedWins;
        sumPF += totalsByOwner.pointsFor;
        sumPA += totalsByOwner.pointsAgainst;

        return {
          x: totalsByOwner.pointsFor,
          y: totalsByOwner.pointsAgainst,
          ownerName,
          abbrev: ownerAbbrev(ownerName),
          totalPointsFor: totalsByOwner.pointsFor,
          totalPointsAgainst: totalsByOwner.pointsAgainst,
          expectedWins,
          actualWins,
          luck,
        };
      });

    const avgPF = sumPF / points.length;
    const avgPA = sumPA / points.length;

    const allValues = points.flatMap((point) => [point.x, point.y]);
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const pad = (dataMax - dataMin) * 0.08 || 50;
    const axisMin = Math.floor((dataMin - pad) / 50) * 50;
    const axisMax = Math.ceil((dataMax + pad) / 50) * 50;

    return {
      points,
      avgPF,
      avgPA,
      axisMin,
      axisMax,
    };
  }
}
