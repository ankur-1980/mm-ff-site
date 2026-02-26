import { Component, computed, inject } from '@angular/core';

import { AllPlayMatrix } from '../../season/season-analytics/all-play-matrix/all-play-matrix';
import { AllTimeAllPlayMatrixService } from './all-play-matrix.service';

@Component({
  selector: 'app-all-play',
  imports: [AllPlayMatrix],
  templateUrl: './all-play.html',
  styleUrl: './all-play.scss',
})
export class AllPlay {
  private readonly allPlayMatrixService = inject(AllTimeAllPlayMatrixService);

  protected readonly matrix = computed(() => this.allPlayMatrixService.buildMatrix());
}
