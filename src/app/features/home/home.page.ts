import { Component, computed, inject } from '@angular/core';

import { LeagueMetaDataFacade, SeasonStandingsDataService } from '../../data';
import { FeatureBanner } from '../../shared/components/feature-banner/feature-banner';
import { SeasonBannerService } from '../season/season-standings/season-banner.service';
import { HeroComponent } from './hero/hero.component';

@Component({
  selector: 'app-home-page',
  imports: [FeatureBanner, HeroComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  protected readonly leagueData = inject(LeagueMetaDataFacade);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly seasonBanner = inject(SeasonBannerService);

  protected readonly currentChampionData = computed(() => {
    const currentSeasonId = this.leagueData.currentSeason()?.id;
    if (currentSeasonId != null) {
      const currentChampion = this.seasonBanner.getChampionData(String(currentSeasonId));
      if (currentChampion) return currentChampion;
    }

    for (const seasonId of this.seasonStandingsData.seasonIds()) {
      const champion = this.seasonBanner.getChampionData(seasonId);
      if (champion) return champion;
    }

    return null;
  });
}
