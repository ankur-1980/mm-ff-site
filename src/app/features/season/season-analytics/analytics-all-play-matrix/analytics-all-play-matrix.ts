import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { AllPlayMatrix } from '../all-play-matrix/all-play-matrix';
import { AllPlayMatrixService } from '../all-play-matrix.service';

@Component({
  selector: 'app-analytics-all-play-matrix',
  standalone: true,
  imports: [AllPlayMatrix],
  templateUrl: './analytics-all-play-matrix.html',
  styleUrl: './analytics-all-play-matrix.scss',
})
export class AnalyticsAllPlayMatrix {
  private readonly route = inject(ActivatedRoute);
  private readonly allPlayMatrixService = inject(AllPlayMatrixService);

  /** Year is on the :year route (parent of analytics), not on this route's direct parent. */
  private readonly year = toSignal(
    (this.route.parent?.parent ?? this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null))
    ),
    { initialValue: null }
  );

  protected readonly allPlayMatrix = computed(() => {
    const y = this.year();
    if (y == null) return null;
    return this.allPlayMatrixService.buildMatrix(String(y));
  });
}
