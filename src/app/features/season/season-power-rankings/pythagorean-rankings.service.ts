import { Injectable } from '@angular/core';

export interface PythagoreanInputRow {
  ownerId: string;
  pointsFor: number;
  pointsAgainst: number;
  gamesPlayed: number;
}

const PYTHAGOREAN_EXPONENT = 2.37;

@Injectable({ providedIn: 'root' })
export class PythagoreanRankingsService {
  calculateExpectedWins(pointsFor: number, pointsAgainst: number, gamesPlayed: number): number {
    if (gamesPlayed <= 0) return 0;
    if (pointsFor <= 0 && pointsAgainst <= 0) return 0;

    const pf = Math.max(pointsFor, 0);
    const pa = Math.max(pointsAgainst, 0);
    const pfPow = Math.pow(pf, PYTHAGOREAN_EXPONENT);
    const paPow = Math.pow(pa, PYTHAGOREAN_EXPONENT);
    const denominator = pfPow + paPow;

    if (denominator === 0) return 0;
    return gamesPlayed * (pfPow / denominator);
  }

  buildRanks(rows: PythagoreanInputRow[]): Map<string, number> {
    const expectedWins = rows.map((row) => ({
      ownerId: row.ownerId,
      expectedWins: this.calculateExpectedWins(
        row.pointsFor,
        row.pointsAgainst,
        row.gamesPlayed
      ),
    }));

    const sorted = [...expectedWins].sort((a, b) => b.expectedWins - a.expectedWins);
    const ranks = new Map<string, number>();

    let currentRank = 0;
    let lastExpectedWins: number | null = null;

    sorted.forEach((row, index) => {
      if (lastExpectedWins == null || row.expectedWins !== lastExpectedWins) {
        currentRank = index + 1;
        lastExpectedWins = row.expectedWins;
      }
      ranks.set(row.ownerId, currentRank);
    });

    return ranks;
  }
}
