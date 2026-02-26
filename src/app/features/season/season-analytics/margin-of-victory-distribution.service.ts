import { inject, Injectable } from '@angular/core';

import type {
  MarginOfVictoryBin,
  MarginOfVictoryDistributionResult,
} from './margin-of-victory-distribution.models';
import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';

const BIN_WIDTH = 5;

@Injectable({ providedIn: 'root' })
export class MarginOfVictoryDistributionService {
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  buildDistribution(seasonId: string): MarginOfVictoryDistributionResult | null {
    const meta = this.leagueMeta.getSeasonMeta(seasonId);
    if (!meta) return null;

    const margins: number[] = [];

    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchups.getMatchupsForWeek(
        seasonId,
        `week${week}`
      );
      if (!weekData) continue;

      const seenMatchups = new Set<string>();
      for (const entry of Object.values(weekData)) {
        const matchup = entry.matchup;
        if (!matchup?.team1Name || !matchup?.team2Name) continue;

        const matchupKey = [matchup.team1Id, matchup.team2Id].sort().join('|');
        if (seenMatchups.has(matchupKey)) continue;
        seenMatchups.add(matchupKey);

        const s1 = Number(matchup.team1Score);
        const s2 = Number(matchup.team2Score);
        if (Number.isNaN(s1) || Number.isNaN(s2)) continue;

        margins.push(Math.abs(s1 - s2));
      }
    }

    if (margins.length === 0) {
      return { bins: [] };
    }

    const maxMargin = Math.max(...margins);
    const numBins = Math.max(1, Math.ceil((maxMargin + 1) / BIN_WIDTH));
    const binCounts = new Array<number>(numBins).fill(0);

    for (const m of margins) {
      const index = Math.min(
        Math.floor(m / BIN_WIDTH),
        numBins - 1
      );
      binCounts[index] += 1;
    }

    const bins: MarginOfVictoryBin[] = binCounts.map((count, i) => {
      const min = i * BIN_WIDTH;
      const max = min + BIN_WIDTH;
      const label = max > maxMargin && i === numBins - 1
        ? `${min}+`
        : `${min}–${max}`;
      return { label, min, max, count };
    });

    return { bins };
  }
}
