import { Component, computed, effect, inject } from '@angular/core';

import { LeagueMetaDataFacade, SeasonStandingsDataService } from '../../data';
import type { HonorBannerData } from '../../models/honor-banner.model';
import { OwnersDataService } from '../../data/owners-data.service';
import { ToiletBowlDataService } from '../../data/toilet-bowl-data.service';
import { WeeklyMatchupsDataService } from '../../data/weekly-matchups-data.service';
import { HonorBannerComponent } from '../../shared/components/honor-banner/honor-banner.component';
import { CtaButton } from '../../shared/components/cta-button/cta-button';
import { OwnerProfileCard } from '../../shared/components/owner-profile-card/owner-profile-card';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { StatValue } from '../../shared/components/stat-card/stat-value/stat-value';
import { SubsectionHeader } from '../../shared/components/subsection-header/subsection-header';
import { SeasonBannerService } from '../season/season-standings/season-banner.service';
import { AllTimeRecordsService } from '../all-time/records/records.service';
import { HeroComponent } from './hero/hero.component';

@Component({
  selector: 'app-home-page',
  imports: [
    HeroComponent,
    HonorBannerComponent,
    CtaButton,
    OwnerProfileCard,
    StatCard,
    StatValue,
    SubsectionHeader,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  protected readonly leagueData = inject(LeagueMetaDataFacade);
  private readonly ownersData = inject(OwnersDataService);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly toiletBowlData = inject(ToiletBowlDataService);
  private readonly weeklyMatchupsData = inject(WeeklyMatchupsDataService);
  private readonly seasonBanner = inject(SeasonBannerService);
  private readonly allTimeRecords = inject(AllTimeRecordsService);

  constructor() {
    this.ownersData.load();
    this.seasonStandingsData.load();
    this.toiletBowlData.load();

    effect(() => {
      const seasonIds = this.seasonStandingsData.seasonIds();
      if (!seasonIds.length) return;
      this.weeklyMatchupsData.loadSeasons(seasonIds);
    });
  }

  private readonly allTimeRecordRows = computed(() => this.allTimeRecords.toTableState().data);

  protected readonly legendaryMostWins = computed(() => this.allTimeRecordRows()[0] ?? null);

  protected readonly legendaryMostChampionships = computed(() => {
    const rows = this.allTimeRecordRows();
    if (!rows.length) return null;

    return rows.reduce((best, row) => {
      if (row.championships !== best.championships) {
        return row.championships > best.championships ? row : best;
      }
      if (row.totalSeasons !== best.totalSeasons) {
        return row.totalSeasons > best.totalSeasons ? row : best;
      }
      return row.ownerName.localeCompare(best.ownerName) < 0 ? row : best;
    });
  });

  protected readonly legendaryBiggestBlowout = computed(
    () => this.allTimeRecords.getTopVictoryMarginRecords(1)[0] ?? null,
  );

  protected readonly legendaryHighPointsStarterSeason = computed(
    () => this.allTimeRecords.getTopStarterSeasonRecords(1)[0] ?? null,
  );

  protected readonly ownerCards = computed(() =>
    this.ownersData
      .allOwners()
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 4),
  );

  protected readonly currentSeasonStandingsRoute = computed<readonly string[] | string>(() => {
    const currentSeasonId = this.leagueData.currentSeason()?.id;
    if (currentSeasonId == null) return '/season';
    return ['/season', String(currentSeasonId), 'standings'];
  });

  protected formatSeasonsPlayed(count: number | null | undefined): string {
    if (!count) return 'Seasons played unavailable';
    return `${count} ${count === 1 ? 'season' : 'seasons'} played`;
  }

  protected formatWeekYear(week: number, year: number): string {
    return `Week ${week}, ${year}`;
  }

  protected formatPoints(value: number | null | undefined): string {
    return value != null ? value.toFixed(2) : '--';
  }

  protected formatPlayerDetails(
    playerName: string | null | undefined,
    position: string | null | undefined,
    nflTeam: string | null | undefined,
  ): string {
    if (!playerName) return '';
    if (!position || !nflTeam) return playerName;
    return `${playerName} (${position} - ${nflTeam})`;
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
      const generic = this.getRunnerUpHonorData(seasonId);
      if (generic) return generic;
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
                // teamName: banner.teamName,
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
                // teamName,
                ownerName: toiletBowlEntry.champion,
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
      type: 'generic',
      ownerName: banner.runnerUpOwnerName,
      teamName: banner.runnerUpTeamName ?? runnerUpEntry.playerDetails?.teamName ?? '',
      year: Number(seasonId),
      record: `${record.win}-${record.loss}-${record.tie}`,
    };
  }
}
