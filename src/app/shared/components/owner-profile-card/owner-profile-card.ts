import { Component, computed, inject, input } from '@angular/core';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { OwnersDataService } from '../../../data/owners-data.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';

@Component({
  selector: 'app-owner-profile-card',
  imports: [],
  templateUrl: './owner-profile-card.html',
  styleUrl: './owner-profile-card.scss',
})
export class OwnerProfileCard {
  private readonly ownersData = inject(OwnersDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);
  private readonly standingsData = inject(SeasonStandingsDataService);

  readonly ownerId = input.required<string>();

  protected readonly owner = computed(() => this.ownersData.getOwner(this.ownerId()));

  protected readonly lastSeasonPlayed = computed(() => {
    const seasons = this.owner()?.activeSeasons ?? [];
    if (!seasons.length) return null;
    return Math.max(...seasons);
  });

  protected readonly mostRecentTeamName = computed(() => {
    const owner = this.owner();
    const lastSeasonPlayed = this.lastSeasonPlayed();

    if (!owner || lastSeasonPlayed == null) return '--';

    return (
      this.standingsData.getEntry(String(lastSeasonPlayed), owner.managerName)
        ?.playerDetails.teamName ??
      owner.teamNames[0] ??
      '--'
    );
  });

  protected readonly isActiveOwner = computed(() => {
    const owner = this.owner();
    const currentSeasonId = this.leagueMeta.currentSeasonId();
    if (!owner || currentSeasonId == null) return false;
    return owner.activeSeasons.includes(currentSeasonId);
  });

  protected readonly currentSeasonEntry = computed(() => {
    if (!this.isActiveOwner()) return null;
    const currentSeasonId = this.leagueMeta.currentSeasonId();
    const ownerId = this.ownerId();
    if (currentSeasonId == null) return null;
    return this.standingsData.getEntry(String(currentSeasonId), ownerId);
  });

  protected readonly currentSeasonRecord = computed(() => {
    const entry = this.currentSeasonEntry();
    if (!entry) return '--';
    const { win, loss, tie } = entry.record;
    return `${win}-${loss}-${tie}`;
  });

  protected readonly currentSeasonPlayoffRank = computed(
    () => this.currentSeasonEntry()?.ranks.playoffRank || '--'
  );
}
