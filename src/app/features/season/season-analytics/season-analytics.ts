import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { AllPlayMatrix } from './all-play-matrix/all-play-matrix';
import { AllPlayMatrixService } from './all-play-matrix.service';

@Component({
  selector: 'app-season-analytics',
  imports: [AllPlayMatrix],
  templateUrl: './season-analytics.html',
  styleUrl: './season-analytics.scss',
})
export class SeasonAnalytics {
  private readonly route = inject(ActivatedRoute);
  private readonly allPlayMatrixService = inject(AllPlayMatrixService);

  private readonly year = toSignal(
    (this.route.parent ?? this.route).params.pipe(
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
