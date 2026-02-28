import { Component, computed, inject } from '@angular/core';

import { LeagueMetaDataFacade, SeasonStandingsDataService } from '../../data';
import {
  HonorBannerComponent,
  type HonorBannerData,
} from '../../shared/components/honor-banner/honor-banner.component';
import { SeasonBannerService } from '../season/season-standings/season-banner.service';
import { HeroComponent } from './hero/hero.component';

@Component({
  selector: 'app-home-page',
  imports: [HeroComponent, HonorBannerComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  protected readonly leagueData = inject(LeagueMetaDataFacade);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly seasonBanner = inject(SeasonBannerService);

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
        banner.score != null &&
        banner.runnerUpScore != null &&
        banner.runnerUpTeamName
          ? {
              winnerScore: banner.score,
              winnerTeamName: banner.teamName,
              loserScore: banner.runnerUpScore,
              loserTeamName: banner.runnerUpTeamName,
            }
          : undefined,
    };
  }
}
