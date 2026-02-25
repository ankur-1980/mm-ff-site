import { inject, Injectable } from '@angular/core';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { ToiletBowlDataService } from '../../../data/toilet-bowl-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import type { ChampionBannerData } from '../../../shared/components/feature-banner/feature-banner';

@Injectable({ providedIn: 'root' })
export class ToiletBowlBannerService {
  private readonly toiletBowlData = inject(ToiletBowlDataService);
  private readonly standingsData = inject(SeasonStandingsDataService);
  private readonly matchupsData = inject(WeeklyMatchupsDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  /**
   * Returns toilet bowl banner data for a given season.
   * Returns null if no toilet bowl record exists for that year.
   */
  getToiletBowlData(seasonId: string): ChampionBannerData | null {
    const entry = this.toiletBowlData.getEntry(seasonId);
    if (!entry) return null;

    const standings = this.standingsData.getStandingsForSeason(seasonId);
    if (!standings) return null;

    const championManagerName = entry.champion;
    const champion = Object.values(standings).find(
      (e) => e.playerDetails?.managerName === championManagerName
    );
    if (!champion) return null;

    const championTeamName = champion.playerDetails?.teamName ?? '';

    // Find the toilet bowl final in the last week — any matchup involving
    // the champion's team that is NOT the championship game (rank-1 vs rank-2).
    const meta = this.leagueMeta.getSeasonMeta(seasonId);
    if (!meta) return null;

    const finalWeekKey = `week${meta.seasonEndWeek}`;
    const finalWeek = this.matchupsData.getMatchupsForWeek(seasonId, finalWeekKey);

    let score: number | undefined;
    let runnerUpScore: number | undefined;
    let runnerUpTeamName = '';
    let runnerUpOwnerName = '';

    if (finalWeek) {
      for (const e of Object.values(finalWeek)) {
        const { matchup } = e;
        if (!matchup) continue;

        const isChampSide =
          matchup.team1Name === championTeamName || matchup.team2Name === championTeamName;
        if (!isChampSide) continue;

        if (matchup.team1Name === championTeamName) {
          score = parseFloat(matchup.team1Score);
          runnerUpScore = parseFloat(matchup.team2Score);
          runnerUpTeamName = matchup.team2Name;
        } else {
          score = parseFloat(matchup.team2Score);
          runnerUpScore = parseFloat(matchup.team1Score);
          runnerUpTeamName = matchup.team1Name;
        }

        // Resolve the runner-up's manager name from standings
        const runnerUpEntry = Object.values(standings).find(
          (s) => s.playerDetails?.teamName === runnerUpTeamName
        );
        runnerUpOwnerName = runnerUpEntry?.playerDetails?.managerName ?? runnerUpTeamName;
        break;
      }
    }

    return {
      ownerName: championManagerName,
      teamName: championTeamName,
      score,
      runnerUpOwnerName,
      runnerUpTeamName,
      runnerUpScore,
    };
  }
}
