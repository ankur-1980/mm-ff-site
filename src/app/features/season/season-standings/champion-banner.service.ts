import { inject, Injectable } from '@angular/core';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import type { ChampionBannerData } from '../../../shared/components/feature-banner/feature-banner';

@Injectable({ providedIn: 'root' })
export class ChampionBannerService {
  private readonly standingsData = inject(SeasonStandingsDataService);
  private readonly matchupsData = inject(WeeklyMatchupsDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  /**
   * Derive champion banner data for a given season.
   * Returns null if standings or matchup data isn't available.
   */
  getChampionData(seasonId: string): ChampionBannerData | null {
    const standings = this.standingsData.getStandingsForSeason(seasonId);
    if (!standings) return null;

    const entries = Object.values(standings);
    const champion = entries.find((e) => String(e.ranks?.playoffRank) === '1');
    const runnerUp = entries.find((e) => String(e.ranks?.playoffRank) === '2');
    if (!champion || !runnerUp) return null;

    const championName = champion.playerDetails?.teamName ?? '';
    const runnerUpName = runnerUp.playerDetails?.teamName ?? '';

    const meta = this.leagueMeta.getSeasonMeta(seasonId);
    if (!meta) return null;

    // Seasons without full historical details have no matchup score data.
    let score: number | undefined;
    let runnerUpScore: number | undefined;

    if (meta.hasFullHistoricalDetails) {
      const finalWeekKey = `week${meta.seasonEndWeek}`;
      const finalWeek = this.matchupsData.getMatchupsForWeek(seasonId, finalWeekKey);

      if (finalWeek) {
        for (const entry of Object.values(finalWeek)) {
          const { matchup } = entry;
          if (!matchup) continue;

          const isChampEntry =
            matchup.team1Name === championName && matchup.team2Name === runnerUpName;
          const isRunnerEntry =
            matchup.team1Name === runnerUpName && matchup.team2Name === championName;

          if (isChampEntry) {
            score = parseFloat(matchup.team1Score);
            runnerUpScore = parseFloat(matchup.team2Score);
            break;
          }
          if (isRunnerEntry) {
            score = parseFloat(matchup.team2Score);
            runnerUpScore = parseFloat(matchup.team1Score);
            break;
          }
        }
      }
    }

    return {
      ownerName: champion.playerDetails?.managerName ?? '',
      teamName: championName,
      score,
      runnerUpOwnerName: runnerUp.playerDetails?.managerName ?? '',
      runnerUpTeamName: runnerUpName,
      runnerUpScore,
    };
  }
}
