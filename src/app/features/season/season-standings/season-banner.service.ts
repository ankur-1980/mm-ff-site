import { inject, Injectable } from '@angular/core';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { ToiletBowlDataService } from '../../../data/toilet-bowl-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import type { ChampionBannerData } from '../../../shared/components/feature-banner/feature-banner';
import type { SeasonStandings } from '../../../models/season-standings.model';

interface FinalMatchupResult {
  score: number;
  opponentScore: number;
  opponentTeamName: string;
}

@Injectable({ providedIn: 'root' })
export class SeasonBannerService {
  private readonly standingsData = inject(SeasonStandingsDataService);
  private readonly matchupsData = inject(WeeklyMatchupsDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);
  private readonly toiletBowlData = inject(ToiletBowlDataService);

  /**
   * Find a team's matchup in the season's final week and return both scores
   * plus the opponent's team name.
   */
  private getFinalWeekMatchup(
    seasonId: string,
    teamName: string
  ): FinalMatchupResult | null {
    const meta = this.leagueMeta.getSeasonMeta(seasonId);
    if (!meta) return null;

    const finalWeek = this.matchupsData.getMatchupsForWeek(
      seasonId,
      `week${meta.seasonEndWeek}`
    );
    if (!finalWeek) return null;

    for (const entry of Object.values(finalWeek)) {
      const { matchup } = entry;
      if (!matchup) continue;

      if (matchup.team1Name === teamName) {
        return {
          score: parseFloat(matchup.team1Score),
          opponentScore: parseFloat(matchup.team2Score),
          opponentTeamName: matchup.team2Name,
        };
      }
      if (matchup.team2Name === teamName) {
        return {
          score: parseFloat(matchup.team2Score),
          opponentScore: parseFloat(matchup.team1Score),
          opponentTeamName: matchup.team1Name,
        };
      }
    }

    return null;
  }

  /** Resolve a manager name from standings by team name. */
  private resolveManagerName(standings: SeasonStandings, teamName: string): string {
    const entry = Object.values(standings).find(
      (e) => e.playerDetails?.teamName === teamName
    );
    return entry?.playerDetails?.managerName ?? teamName;
  }

  /** Returns the season champion's banner data. */
  getChampionData(seasonId: string): ChampionBannerData | null {
    const standings = this.standingsData.getStandingsForSeason(seasonId);
    if (!standings) return null;

    const entries = Object.values(standings);
    const champion = entries.find((e) => String(e.ranks?.playoffRank) === '1');
    const runnerUp = entries.find((e) => String(e.ranks?.playoffRank) === '2');
    if (!champion || !runnerUp) return null;

    const teamName = champion.playerDetails?.teamName ?? '';
    const matchup = this.getFinalWeekMatchup(seasonId, teamName);

    return {
      ownerName: champion.playerDetails?.managerName ?? '',
      teamName,
      score: matchup?.score,
      runnerUpOwnerName: runnerUp.playerDetails?.managerName ?? '',
      runnerUpTeamName: runnerUp.playerDetails?.teamName ?? '',
      runnerUpScore: matchup?.opponentScore,
    };
  }

  /** Returns the toilet bowl champion's banner data, or null if none recorded. */
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

    const teamName = champion.playerDetails?.teamName ?? '';
    const matchup = this.getFinalWeekMatchup(seasonId, teamName);

    return {
      ownerName: championManagerName,
      teamName,
      score: matchup?.score,
      runnerUpOwnerName: matchup
        ? this.resolveManagerName(standings, matchup.opponentTeamName)
        : undefined,
      runnerUpTeamName: matchup?.opponentTeamName,
      runnerUpScore: matchup?.opponentScore,
    };
  }
}
