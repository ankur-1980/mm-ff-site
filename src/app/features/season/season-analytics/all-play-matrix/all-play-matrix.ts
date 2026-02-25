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

  protected formatRecord(record: AllPlayPairRecord): string {
    if (record.wins === 0 && record.losses === 0 && record.ties === 0) return '—';
    if (record.ties > 0) {
      return `${record.wins}-${record.losses}-${record.ties}`;
    }
    return `${record.wins}-${record.losses}`;
  }
}
