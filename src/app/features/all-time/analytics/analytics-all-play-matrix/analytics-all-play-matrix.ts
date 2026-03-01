import { Component, computed, inject } from '@angular/core';

import { AllTimeAllPlayMatrixService } from '../../all-play/all-play-matrix.service';
import { AllPlayMatrix } from '../../../season/season-analytics/all-play-matrix/all-play-matrix';
import { SubsectionHeader } from '../../../../shared/components/subsection-header/subsection-header';

@Component({
  selector: 'app-all-time-analytics-all-play-matrix',
  imports: [AllPlayMatrix, SubsectionHeader],
  templateUrl: './analytics-all-play-matrix.html',
  styleUrl: './analytics-all-play-matrix.scss',
})
export class AnalyticsAllPlayMatrix {
  private readonly allPlayMatrixService = inject(AllTimeAllPlayMatrixService);

  protected readonly matrix = computed(() => this.allPlayMatrixService.buildMatrix());
}
