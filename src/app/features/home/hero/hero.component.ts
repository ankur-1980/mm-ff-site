import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { OwnersDataService } from '../../../data/owners-data.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import { IntersectDirective } from '../../../shared/intersect.directive';

interface HeroStat {
  readonly label: string;
  readonly value: string;
  readonly icon?: string;
}

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  imports: [MatIconModule, IntersectDirective],
  host: { '[class.hero--hidden]': '!isVisible()' },
})
export class HeroComponent {
  private readonly league = inject(LeagueMetaDataService);
  private readonly owners = inject(OwnersDataService);
  private readonly seasonStandings = inject(SeasonStandingsDataService);
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);
  private readonly wholeNumber = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  });

  readonly scrollTargetId = input<string>('home-content');
  protected readonly isVisible = signal(true);

  protected readonly leagueName = computed(
    () => this.league.leagueData()?.name ?? 'Midwest Madness',
  );
  protected readonly seasonCount = computed(() => Object.keys(this.league.seasons()).length);
  protected readonly totalOwnerCount = computed(() => this.owners.allOwners().length);

  protected readonly totalRegularSeasonPoints = computed(() => {
    const standings = this.seasonStandings.seasonStandingsData();
    if (!standings) return 0;

    let total = 0;
    for (const season of Object.values(standings)) {
      for (const entry of Object.values(season)) {
        total += entry.points.pointsFor;
      }
    }

    return total;
  });

  protected readonly totalRegularSeasonGames = computed(() => {
    const seasons = this.league.seasons();
    const standings = this.seasonStandings.seasonStandingsData();
    const matchups = this.weeklyMatchups.weeklyMatchupsData();
    if (!standings || !Object.keys(seasons).length) return 0;

    let total = 0;

    for (const [seasonId, meta] of Object.entries(seasons)) {
      const seasonStandings = standings[seasonId];
      if (!seasonStandings) continue;

      const teamCount = Object.keys(seasonStandings).length;
      const gamesPerWeek = teamCount / 2;

      if (!meta.hasFullHistoricalDetails) {
        total += gamesPerWeek * meta.regularSeasonEndWeek;
        continue;
      }

      const seasonWeeks = matchups?.[seasonId];
      for (let week = 1; week <= meta.regularSeasonEndWeek; week++) {
        const weekEntries = seasonWeeks?.[`week${week}`];
        total += weekEntries ? Object.keys(weekEntries).length / 2 : gamesPerWeek;
      }
    }

    return total;
  });

  protected readonly heroMeta = computed(() => [
    `${this.seasonCount()} Seasons`,
    `${this.totalOwnerCount()} Owners`,
    'Countless Regrets.',
  ]);

  protected readonly stats = computed<readonly HeroStat[]>(() => [
    {
      label: 'Points Scored',
      value: this.wholeNumber.format(this.totalRegularSeasonPoints()),
    },
    {
      label: 'Games Played',
      value: this.wholeNumber.format(this.totalRegularSeasonGames()),
    },
    {
      label: 'Commissioners Fired',
      value: '',
      icon: 'all_inclusive',
    },
    {
      label: 'Original Owners',
      value: '6',
    },
  ]);

  constructor() {
    this.league.load();
    this.owners.load();
    this.seasonStandings.load();

    effect(() => {
      const fullHistorySeasonIds = Object.entries(this.league.seasons())
        .filter(([, meta]) => meta.hasFullHistoricalDetails)
        .map(([seasonId]) => seasonId);

      if (fullHistorySeasonIds.length) {
        this.weeklyMatchups.loadSeasons(fullHistorySeasonIds);
      }
    });
  }

  scrollToContent(): void {
    const id = this.scrollTargetId();
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
