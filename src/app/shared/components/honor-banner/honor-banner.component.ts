import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { OwnersDataService } from '../../../data/owners-data.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';

export type HonorType = 'premier' | 'consolation' | 'runnerUp';

export interface HonorBannerMatchup {
  winnerScore: number;
  winnerTeamName: string;
  loserScore: number;
  loserTeamName: string;
  note?: string;
}

export interface HonorBannerData {
  type: HonorType;
  ownerName: string;
  teamName: string;
  year: number;
  record: string;
  matchup?: HonorBannerMatchup;
}

interface HonorBannerResolvedMatchup {
  leftScore: number;
  leftTeamName: string;
  rightScore: number;
  rightTeamName: string;
  note?: string;
}

interface HonorBannerTypeConfig {
  headerTitle: string;
  labelText: string;
  themeClass: string;
  iconKind: 'mat' | 'image';
  iconValue: string;
  showMatchup: boolean;
  matchupInverted: boolean;
  footerContextResolver: (honor: HonorBannerData) => string;
}

@Component({
  selector: 'app-honor-banner',
  imports: [DecimalPipe, NgOptimizedImage, MatCardModule, MatIconModule],
  templateUrl: './honor-banner.component.html',
  styleUrl: './honor-banner.component.scss',
})
export class HonorBannerComponent {
  private readonly ownersData = inject(OwnersDataService);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);

  readonly honor = input.required<HonorBannerData>();

  // How to add a new honor type: extend HonorType, add a config entry here,
  // and provide the footer resolver plus matchup behavior for that new type.
  private readonly configByType: Record<HonorType, HonorBannerTypeConfig> = {
    premier: {
      headerTitle: 'Champion',
      labelText: 'Champion',
      themeClass: 'honor-banner--premier',
      iconKind: 'mat',
      iconValue: 'trophy',
      showMatchup: true,
      matchupInverted: false,
      footerContextResolver: (honor) => this.resolvePremierFooter(honor),
    },
    consolation: {
      headerTitle: 'Toilet Bowl Winner',
      labelText: 'Toilet Bowl Winner',
      themeClass: 'honor-banner--consolation',
      iconKind: 'image',
      iconValue: 'assets/icons/toilet.svg',
      showMatchup: true,
      matchupInverted: true,
      footerContextResolver: (honor) => this.resolveConsolationFooter(honor),
    },
    runnerUp: {
      headerTitle: 'Runner Up',
      labelText: 'Runner Up',
      themeClass: 'honor-banner--runner-up',
      iconKind: 'mat',
      iconValue: 'looks_two',
      showMatchup: false,
      matchupInverted: false,
      footerContextResolver: (honor) => this.resolveRunnerUpFooter(honor),
    },
  };

  protected readonly config = computed(() => this.configByType[this.honor().type]);
  protected readonly honorLabel = computed(
    () => `${this.honor().year} ${this.config().labelText}`,
  );
  protected readonly hasSecondary = computed(
    () => this.config().showMatchup && this.honor().matchup != null,
  );
  protected readonly footerContext = computed(
    () => this.config().footerContextResolver(this.honor()),
  );
  protected readonly resolvedMatchup = computed<HonorBannerResolvedMatchup | null>(() => {
    if (!this.hasSecondary()) return null;

    const matchup = this.honor().matchup;
    if (!matchup) return null;

    if (this.config().matchupInverted) {
      return {
        leftScore: matchup.loserScore,
        leftTeamName: matchup.loserTeamName,
        rightScore: matchup.winnerScore,
        rightTeamName: matchup.winnerTeamName,
        note: matchup.note,
      };
    }

    return {
      leftScore: matchup.winnerScore,
      leftTeamName: matchup.winnerTeamName,
      rightScore: matchup.loserScore,
      rightTeamName: matchup.loserTeamName,
      note: matchup.note,
    };
  });

  constructor() {
    this.ownersData.load();
    this.seasonStandingsData.load();
  }

  private resolvePremierFooter(honor: HonorBannerData): string {
    const championships = this.ownersData.getOwner(honor.ownerName)?.championships ?? 0;
    const label = championships === 1 ? 'championship' : 'championships';
    return `${championships} ${label} all-time`;
  }

  private resolveRunnerUpFooter(honor: HonorBannerData): string {
    const count = this.seasonStandingsData.seasonIds().reduce((total, seasonId) => {
      const entry = this.seasonStandingsData.getEntry(seasonId, honor.ownerName);
      if (String(entry?.ranks?.playoffRank ?? '').trim() === '2') {
        return total + 1;
      }

      return total;
    }, 0);

    const label = count === 1 ? 'runner-up finish' : 'runner-up finishes';
    return `${count} ${label}`;
  }

  private resolveConsolationFooter(honor: HonorBannerData): string {
    const regularSeasonRank = this.seasonStandingsData
      .getEntry(String(honor.year), honor.ownerName)
      ?.ranks?.regularSeasonRank;

    const rank = String(regularSeasonRank ?? '').trim();
    if (!rank) {
      return 'Regular-season rank unavailable';
    }

    return `Finished #${rank} in the regular season`;
  }
}
