import { Component, input } from '@angular/core';

import type { AllPlayMatrixResult, AllPlayPairRecord } from '../all-play-matrix.models';

@Component({
  selector: 'app-all-play-matrix',
  standalone: true,
  templateUrl: './all-play-matrix.html',
  styleUrl: './all-play-matrix.scss',
})
export class AllPlayMatrix {
  readonly matrix = input<AllPlayMatrixResult | null>(null);
  readonly showWinPct = input<boolean>(false);

  protected formatRecord(record: AllPlayPairRecord): string {
    if (record.wins === 0 && record.losses === 0 && record.ties === 0) return '—';
    if (record.ties > 0) {
      return `${record.wins}-${record.losses}-${record.ties}`;
    }
    return `${record.wins}-${record.losses}`;
  }

  protected formatWinPct(record: AllPlayPairRecord): string {
    const games = record.wins + record.losses + record.ties;
    if (games === 0) return '—';
    const pct = ((record.wins + 0.5 * record.ties) / games) * 100;
    return `${pct.toFixed(2)}%`;
  }
}
