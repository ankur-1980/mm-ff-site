import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LeagueMetaDataService } from '../../data/league-metadata.service';
import { OwnersDataService } from '../../data/owners-data.service';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { OwnerProfileCard } from '../../shared/components/owner-profile-card/owner-profile-card';
import { OWNER_TABS } from './owners-tabs';

@Component({
  selector: 'app-owners-page',
  imports: [SectionHeader, RouterLink, OwnerProfileCard],
  templateUrl: './owners.page.html',
  styleUrl: './owners.page.scss'
})
export class OwnersPage {
  private readonly ownersData = inject(OwnersDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  protected readonly ownerCards = OWNER_TABS;

  protected readonly subtitle = computed(() => {
    const owners = this.ownersData.allOwners();
    const firstYear = this.getFirstYear(owners);
    const activeOwnersCount = this.getActiveOwnersCount(owners);

    return [
      `Since ${firstYear ?? '--'}`,
      `${owners.length} Owners`,
      `${activeOwnersCount} Active Owners`,
    ];
  });

  protected readonly tertiarySubtitle = computed(() => {
    const owners = this.ownersData.allOwners();
    const winsLeader = this.getWinsLeaderName(owners);
    const championshipsLeader = this.getChampionshipsLeaderName(owners);

    return [
      `Most Regular Season Wins - ${winsLeader}`,
      `Most Championships - ${championshipsLeader}`,
    ];
  });

  private getFirstYear(owners: ReturnType<OwnersDataService['allOwners']>): number | null {
    const seasons = owners.flatMap((owner) => owner.activeSeasons);
    if (!seasons.length) return null;
    return Math.min(...seasons);
  }

  private getActiveOwnersCount(owners: ReturnType<OwnersDataService['allOwners']>): number {
    if (!owners.length) return 0;

    const currentSeasonId = this.leagueMeta.currentSeasonId();
    const targetSeason = currentSeasonId ?? this.getMostRecentSeason(owners);
    if (targetSeason == null) return 0;

    return owners.filter((owner) => owner.activeSeasons.includes(targetSeason)).length;
  }

  private getMostRecentSeason(
    owners: ReturnType<OwnersDataService['allOwners']>
  ): number | null {
    const seasons = owners.flatMap((owner) => owner.activeSeasons);
    if (!seasons.length) return null;
    return Math.max(...seasons);
  }

  private getWinsLeaderName(owners: ReturnType<OwnersDataService['allOwners']>): string {
    if (!owners.length) return '--';
    return owners.reduce((best, owner) => (owner.wins > best.wins ? owner : best)).managerName;
  }

  private getChampionshipsLeaderName(
    owners: ReturnType<OwnersDataService['allOwners']>
  ): string {
    if (!owners.length) return '--';
    return owners.reduce((best, owner) =>
      owner.championships > best.championships ? owner : best
    ).managerName;
  }
}
