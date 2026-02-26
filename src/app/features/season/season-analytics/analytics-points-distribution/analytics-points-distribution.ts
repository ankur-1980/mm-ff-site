import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import type { BoxPlotTeamStats } from '../points-distribution.models';
import { PointsDistributionService } from '../points-distribution.service';

@Component({
  selector: 'app-analytics-points-distribution',
  standalone: true,
  templateUrl: './analytics-points-distribution.html',
  styleUrl: './analytics-points-distribution.scss',
})
export class AnalyticsPointsDistribution {
  private readonly route = inject(ActivatedRoute);
  private readonly pointsDistribution = inject(PointsDistributionService);

  private readonly year = toSignal(
    (this.route.parent?.parent ?? this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null))
    ),
    { initialValue: null }
  );

  protected readonly boxPlotStats = computed<BoxPlotTeamStats[] | null>(() => {
    const y = this.year();
    if (y == null) return null;
    return this.pointsDistribution.buildBoxPlotStats(String(y));
  });

  /** Global scale: min/max in increments of 10, extending below lowest and above highest data. */
  protected readonly scale = computed(() => {
    const stats = this.boxPlotStats();
    if (!stats?.length) return { min: 0, max: 100, ticks: [0, 50, 100] };
    let dataMin = Infinity;
    let dataMax = -Infinity;
    for (const s of stats) {
      const low = Math.min(s.lowerWhisker, ...s.outliers.map((o) => o.points));
      const high = Math.max(s.upperWhisker, ...s.outliers.map((o) => o.points));
      if (low < dataMin) dataMin = low;
      if (high > dataMax) dataMax = high;
    }
    const min = Math.floor(dataMin / 10) * 10;
    const max = Math.ceil(dataMax / 10) * 10;
    const ticks: number[] = [];
    for (let t = min; t <= max; t += 10) ticks.push(t);
    return { min, max, ticks };
  });

  /** Convert points value to percentage (0–100) for horizontal position. */
  protected toPct(value: number): number {
    const s = this.scale();
    const range = s.max - s.min;
    if (range <= 0) return 0;
    return Math.max(0, Math.min(100, ((value - s.min) / range) * 100));
  }

  protected tooltipText(team: BoxPlotTeamStats): string {
    const lines = [
      `Min (non-outlier): ${team.lowerWhisker.toFixed(1)}`,
      `Q1: ${team.q1.toFixed(1)}`,
      `Median: ${team.median.toFixed(1)}`,
      `Q3: ${team.q3.toFixed(1)}`,
      `Max (non-outlier): ${team.upperWhisker.toFixed(1)}`,
    ];
    if (team.outliers.length > 0) {
      lines.push(
        'Outliers: ' +
          team.outliers.map((o) => `Week ${o.week}: ${o.points.toFixed(1)}`).join(', ')
      );
    }
    return lines.join('\n');
  }
}
