import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';

export interface ChampionBannerData {
  ownerName: string;
  teamName: string;
  score?: number;
  runnerUpOwnerName?: string;
  runnerUpTeamName?: string;
  runnerUpScore?: number;
}

@Component({
  selector: 'app-feature-banner',
  imports: [DecimalPipe],
  templateUrl: './feature-banner.html',
  styleUrl: './feature-banner.scss',
})
export class FeatureBanner {
  readonly data = input<ChampionBannerData | null>(null);
  readonly label = input<string>('Champion');
}
