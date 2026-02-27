import { Component, computed, inject, input } from '@angular/core';

import { OwnersDataService } from '../../../data/owners-data.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import { ToiletBowlDataService } from '../../../data/toilet-bowl-data.service';
import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { StatValue } from '../../../shared/components/stat-card/stat-value/stat-value';

interface NameHistoryItem {
  name: string;
  lastYearUsed: number | null;
}

interface GamePointsAward {
  points: number;
  week: number;
  year: number;
}

@Component({
  selector: 'app-owner-profile-page',
  imports: [StatCard, StatValue],
  templateUrl: './owner-profile-page.html',
  styleUrl: './owner-profile-page.scss',
})
export class OwnerProfilePage {
  private readonly ownersData = inject(OwnersDataService);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly weeklyMatchupsData = inject(WeeklyMatchupsDataService);
  private readonly toiletBowlData = inject(ToiletBowlDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  readonly ownerId = input.required<string>();

  protected readonly owner = computed(() => this.ownersData.getOwner(this.ownerId()));

  protected readonly currentSeasonId = computed(
    () => this.leagueMeta.currentSeasonId() ?? null
  );

  protected readonly isActiveOwner = computed(() => {
    const owner = this.owner();
    const currentSeasonId = this.currentSeasonId();
    if (!owner || currentSeasonId == null) return false;
    return owner.activeSeasons.includes(currentSeasonId);
  });

  protected readonly allTimeRecord = computed(() => {
    const owner = this.owner();
    if (!owner) return '--';
    return `${owner.wins}-${owner.losses}-${owner.ties}`;
  });

  protected readonly mostRecentTeamName = computed(
    () => this.owner()?.teamNames.at(-1) ?? '--'
  );

  private readonly ownerSeasonEntries = computed(() => {
    const owner = this.owner();
    if (!owner) return [];

    return [...owner.activeSeasons]
      .sort((a, b) => a - b)
      .map((season) => ({
        season,
        entry: this.seasonStandingsData.getEntry(String(season), owner.managerName),
      }));
  });

  protected readonly nameHistory = computed<NameHistoryItem[]>(() => {
    const owner = this.owner();
    const seasonEntries = this.ownerSeasonEntries();
    if (!owner) return [];

    return owner.teamNames.map((teamName) => {
      const lastYearUsed = seasonEntries.reduce<number | null>((latest, item) => {
        if (item.entry?.playerDetails.teamName !== teamName) return latest;
        return latest == null || item.season > latest ? item.season : latest;
      }, null);

      return { name: teamName, lastYearUsed };
    });
  });

  protected readonly championshipYears = computed<Set<number>>(() => {
    const years = new Set<number>();
    for (const { season, entry } of this.ownerSeasonEntries()) {
      if (entry?.ranks.playoffRank === '1') years.add(season);
    }
    return years;
  });

  protected readonly toiletBowlYears = computed<Set<number>>(() => {
    const owner = this.owner();
    const years = new Set<number>();
    if (!owner) return years;

    for (const season of owner.activeSeasons) {
      const entry = this.toiletBowlData.getEntry(String(season));
      if (entry?.champion === owner.managerName) years.add(season);
    }

    return years;
  });

  protected readonly activeSeasonYears = computed(() => {
    const owner = this.owner();
    const championshipYears = this.championshipYears();
    const toiletBowlYears = this.toiletBowlYears();
    if (!owner) return [];

    return [...owner.activeSeasons]
      .sort((a, b) => a - b)
      .map((year) => ({
        year,
        isChampion: championshipYears.has(year),
        isToiletBowlChampion: toiletBowlYears.has(year),
      }));
  });

  protected readonly seasonPointsAwards = computed(() => {
    const pointsByYear = this.ownerSeasonEntries()
      .filter((item) => item.entry != null)
      .map((item) => ({
        year: item.season,
        points: item.entry!.points.pointsFor,
      }));

    if (!pointsByYear.length) {
      return { highest: null, lowest: null };
    }

    const highest = pointsByYear.reduce((best, current) =>
      current.points > best.points ? current : best
    );
    const lowest = pointsByYear.reduce((best, current) =>
      current.points < best.points ? current : best
    );

    return { highest, lowest };
  });

  private readonly ownerGameScores = computed(() => {
    const owner = this.owner();
    if (!owner) return [];

    const ownerTeamNames = new Set(owner.teamNames);
    const scores: GamePointsAward[] = [];

    for (const season of owner.activeSeasons) {
      const seasonId = String(season);
      const seasonStandings = this.seasonStandingsData.getStandingsForSeason(seasonId);
      const seasonTeamOwnerMap = new Map<string, string>();

      if (seasonStandings) {
        for (const standingsEntry of Object.values(seasonStandings)) {
          seasonTeamOwnerMap.set(
            standingsEntry.playerDetails.teamName,
            standingsEntry.playerDetails.managerName
          );
        }
      }

      for (const weekKey of this.weeklyMatchupsData.getWeekKeysForSeason(seasonId)) {
        const weekEntries = this.weeklyMatchupsData.getMatchupsForWeek(seasonId, weekKey);
        if (!weekEntries) continue;

        for (const matchupEntry of Object.values(weekEntries)) {
          const teamName = matchupEntry.matchup.team1Name;
          const managerForTeam = seasonTeamOwnerMap.get(teamName);
          const belongsToOwner =
            managerForTeam === owner.managerName ||
            (managerForTeam == null && ownerTeamNames.has(teamName));

          if (!belongsToOwner) continue;

          scores.push({
            points: matchupEntry.team1Totals.totalPoints,
            week: matchupEntry.week,
            year: matchupEntry.season,
          });
        }
      }
    }

    return scores;
  });

  protected readonly gamePointsAwards = computed(() => {
    const scores = this.ownerGameScores();
    if (!scores.length) {
      return { highest: null, lowest: null };
    }

    const highest = scores.reduce((best, current) =>
      current.points > best.points ? current : best
    );
    const lowest = scores.reduce((best, current) =>
      current.points < best.points ? current : best
    );

    return { highest, lowest };
  });

  protected formatSeasonFooter(year: number | null): string {
    return year == null ? '--' : String(year);
  }

  protected formatGameFooter(award: GamePointsAward | null): string {
    if (!award) return '--';
    return `Week ${award.week} / ${award.year}`;
  }
}
