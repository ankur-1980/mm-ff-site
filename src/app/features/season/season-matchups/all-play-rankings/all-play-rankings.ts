import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import type { AllPlayEntry } from '../weekly-stats.models';

@Component({
  selector: 'app-all-play-rankings',
  imports: [DecimalPipe, MatDividerModule],
  templateUrl: './all-play-rankings.html',
  styleUrl: './all-play-rankings.scss',
})
export class AllPlayRankings {
  readonly rankings = input<AllPlayEntry[]>([]);

  protected formatRecord(entry: AllPlayEntry): string {
    return entry.ties > 0
      ? `${entry.wins}-${entry.losses}-${entry.ties}`
      : `${entry.wins}-${entry.losses}`;
  }
}
