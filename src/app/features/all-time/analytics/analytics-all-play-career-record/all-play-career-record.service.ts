import { inject, Injectable } from '@angular/core';

import { LeagueMetaDataService } from '../../../../data/league-metadata.service';
import { SeasonStandingsDataService } from '../../../../data/season-standings-data.service';
import { WeeklyMatchupsDataService } from '../../../../data/weekly-matchups-data.service';
import { AllTimeAllPlayMatrixService } from '../../all-play/all-play-matrix.service';

export interface AllPlayCareerRecordPoint {
  ownerName: string;
  allPlayWinPct: number;
  actualWinPct: number;
}

export interface AllPlayCareerRecordResult {
  points: AllPlayCareerRecordPoint[];
}

@Injectable({ providedIn: 'root' })
export class AllPlayCareerRecordService {
  private readonly allPlayMatrix = inject(AllTimeAllPlayMatrixService);
  private readonly standingsData = inject(SeasonStandingsDataService);
  private readonly weeklyData = inject(WeeklyMatchupsDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  private seasonsWithUsableRegularSeasonData(): Set<string> {
    const included = new Set<string>();

    for (const seasonId of this.weeklyData.seasonIds()) {
      const meta = this.leagueMeta.getSeasonMeta(seasonId);
      const season = this.weeklyData.getSeasonWeeks(seasonId);
      if (!meta || !season) continue;

      for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
        const weekData = season[`week${week}`];
        if (weekData && Object.keys(weekData).length > 0) {
          included.add(seasonId);
          break;
        }
      }
    }

    return included;
  }

  buildCareerRecord(): AllPlayCareerRecordResult | null {
    const matrix = this.allPlayMatrix.buildMatrix();
    if (!matrix) return null;

    const includedSeasons = this.seasonsWithUsableRegularSeasonData();
    const actualByOwner = new Map<string, { wins: number; losses: number; ties: number }>();

    for (const seasonId of includedSeasons) {
      const standings = this.standingsData.getStandingsForSeason(seasonId);
      if (!standings) continue;

      for (const entry of Object.values(standings)) {
        const ownerName = entry.playerDetails?.managerName;
        if (!ownerName) continue;

        const wins = Number(entry.record?.win ?? 0);
        const losses = Number(entry.record?.loss ?? 0);
        const ties = Number(entry.record?.tie ?? 0);

        const current = actualByOwner.get(ownerName) ?? { wins: 0, losses: 0, ties: 0 };
        current.wins += wins;
        current.losses += losses;
        current.ties += ties;
        actualByOwner.set(ownerName, current);
      }
    }

    const points = matrix.teamNames
      .map((ownerDisplay) => {
      const ownerName = ownerDisplay.replace(/\s\(\d+\)$/, '');
      const allPlayRecord = matrix.getTotalRecord(ownerDisplay);
      const allPlayGames = allPlayRecord.wins + allPlayRecord.losses + allPlayRecord.ties;
      const allPlayWinPct =
        allPlayGames > 0
          ? ((allPlayRecord.wins + 0.5 * allPlayRecord.ties) / allPlayGames) * 100
          : 0;

      const actualRecord = actualByOwner.get(ownerName) ?? { wins: 0, losses: 0, ties: 0 };
      const actualGames = actualRecord.wins + actualRecord.losses + actualRecord.ties;
      const actualWinPct =
        actualGames > 0 ? ((actualRecord.wins + 0.5 * actualRecord.ties) / actualGames) * 100 : 0;

      return {
        ownerName,
        allPlayWinPct,
        actualWinPct,
        allPlayGames,
      };
      })
      .filter((point) => point.allPlayGames > 0)
      .map(({ ownerName, allPlayWinPct, actualWinPct }) => ({
        ownerName,
        allPlayWinPct,
        actualWinPct,
      }));

    return {
      points: points.sort((a, b) => a.ownerName.localeCompare(b.ownerName)),
    };
  }
}
