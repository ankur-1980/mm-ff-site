import { Component, computed, inject } from '@angular/core';

import { LeagueMetaDataFacade, SeasonStandingsDataService } from '../../data';
import type { HonorBannerData } from '../../models/honor-banner.model';
import { ToiletBowlDataService } from '../../data/toilet-bowl-data.service';
import { HonorBannerComponent } from '../../shared/components/honor-banner/honor-banner.component';
import { SeasonBannerService } from '../season/season-standings/season-banner.service';
import { HeroComponent } from './hero/hero.component';

@Component({
  selector: 'app-home-page',
  imports: [HeroComponent, HonorBannerComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  protected readonly leagueData = inject(LeagueMetaDataFacade);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly toiletBowlData = inject(ToiletBowlDataService);
  private readonly seasonBanner = inject(SeasonBannerService);

  constructor() {
    this.toiletBowlData.load();
  }

  protected readonly currentChampionData = computed<HonorBannerData | null>(() => {
    const currentSeasonId = this.leagueData.currentSeason()?.id;
    if (currentSeasonId != null) {
      const currentChampion = this.getChampionHonorData(String(currentSeasonId));
      if (currentChampion) return currentChampion;
    }

    for (const seasonId of this.seasonStandingsData.seasonIds()) {
      const champion = this.getChampionHonorData(seasonId);
      if (champion) return champion;
    }

    return null;
  });

  protected readonly currentUltimateLoserData = computed<HonorBannerData | null>(() => {
    const currentSeasonId = this.leagueData.currentSeason()?.id;

    if (currentSeasonId != null) {
      const currentToiletBowl = this.getToiletBowlHonorData(String(currentSeasonId));
      if (currentToiletBowl) return currentToiletBowl;
    }

    for (const seasonId of this.seasonStandingsData.seasonIds()) {
      const toiletBowlWinner = this.getToiletBowlHonorData(seasonId);
      if (toiletBowlWinner) return toiletBowlWinner;
    }

    return null;
  });

  protected readonly currentRunnerUpData = computed<HonorBannerData | null>(() => {
    const currentSeasonId = this.leagueData.currentSeason()?.id;
    if (currentSeasonId != null) {
      const currentRunnerUp = this.getRunnerUpHonorData(String(currentSeasonId));
      if (currentRunnerUp) return currentRunnerUp;
    }

    for (const seasonId of this.seasonStandingsData.seasonIds()) {
      const runnerUp = this.getRunnerUpHonorData(seasonId);
      if (runnerUp) return runnerUp;
    }

    return null;
  });

  private getChampionHonorData(seasonId: string): HonorBannerData | null {
    const banner = this.seasonBanner.getChampionData(seasonId);
    if (!banner) return null;

    const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
    if (!standings) return null;

    const championEntry = Object.values(standings).find(
      (entry) => entry.playerDetails?.managerName === banner.ownerName,
    );
    if (!championEntry) return null;

    const record = championEntry.record;

    return {
      type: 'premier',
      ownerName: banner.ownerName,
      teamName: banner.teamName,
      year: Number(seasonId),
      record: `${record.win}-${record.loss}-${record.tie}`,
      matchup:
        banner.score != null && banner.runnerUpScore != null && banner.runnerUpTeamName
          ? {
              team1: {
                teamName: banner.teamName,
                ownerName: banner.ownerName,
                totalPoints: banner.score,
                result: 'winner',
              },
              team2: {
                teamName: banner.runnerUpTeamName,
                ownerName: banner.runnerUpOwnerName,
                totalPoints: banner.runnerUpScore,
                result: 'loser',
              },
            }
          : undefined,
    };
  }

  private getToiletBowlHonorData(seasonId: string): HonorBannerData | null {
    const toiletBowlEntry = this.toiletBowlData.getEntry(seasonId);
    if (!toiletBowlEntry) return null;

    const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
    if (!standings) return null;

    const winnerEntry = Object.values(standings).find(
      (entry) => entry.playerDetails?.managerName === toiletBowlEntry.champion,
    );
    if (!winnerEntry) return null;

    const banner = this.seasonBanner.getToiletBowlData(seasonId);
    const record = winnerEntry.record;
    const teamName = winnerEntry.playerDetails?.teamName ?? banner?.teamName ?? '';

    return {
      type: 'consolation',
      ownerName: toiletBowlEntry.champion,
      teamName,
      year: Number(seasonId),
      record: `${record.win}-${record.loss}-${record.tie}`,
      matchup:
        banner?.score != null && banner.runnerUpScore != null && banner.runnerUpTeamName
          ? {
              team1: {
                teamName: banner.runnerUpTeamName,
                ownerName: banner.runnerUpOwnerName,
                totalPoints: banner.runnerUpScore,
                result: 'loser',
              },
              team2: {
                teamName,
                ownerName: toiletBowlEntry.champion,
                totalPoints: banner.score,
                result: 'winner',
              },
            }
          : undefined,
    };
  }

  private getRunnerUpHonorData(seasonId: string): HonorBannerData | null {
    const banner = this.seasonBanner.getChampionData(seasonId);
    if (!banner?.runnerUpOwnerName) return null;

    const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
    if (!standings) return null;

    const runnerUpEntry = Object.values(standings).find(
      (entry) => entry.playerDetails?.managerName === banner.runnerUpOwnerName,
    );
    if (!runnerUpEntry) return null;

    const record = runnerUpEntry.record;

    return {
      type: 'runnerUp',
      ownerName: banner.runnerUpOwnerName,
      teamName: banner.runnerUpTeamName ?? runnerUpEntry.playerDetails?.teamName ?? '',
      year: Number(seasonId),
      record: `${record.win}-${record.loss}-${record.tie}`,
    };
  }
}
