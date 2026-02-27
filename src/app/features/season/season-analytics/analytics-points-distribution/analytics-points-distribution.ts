import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import type { BoxPlotTeamStats } from '../models/points-distribution.models';
import { PointsDistributionService } from '../services/points-distribution.service';

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
    (this.route.parent?.parent ?? this.route.parent ?? this.route).paramMap.pipe(
      map((pm) => {
        const raw = pm.get('year');
        const n = raw == null ? NaN : Number(raw);
        return Number.isFinite(n) ? n : null;
      }),
    ),
    { initialValue: null },
  );

  protected readonly boxPlotStats = computed<BoxPlotTeamStats[] | null>(() => {
    const y = this.year();
    if (y == null) return null;
    return this.pointsDistribution.buildBoxPlotStats(String(y));
  });

  /** Global scale: min/max in increments of 10, extending below lowest and above highest data. */
  protected readonly scale = computed(() => {
    const stats = this.boxPlotStats();

    if (!stats?.length) {
      return { min: 0, max: 100, ticks: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] };
    }

    let dataMin = Infinity;
    let dataMax = -Infinity;

    for (const s of stats) {
      const outlierPoints = s.outliers.map((o) => o.points);

      const low = outlierPoints.length
        ? Math.min(s.lowerWhisker, ...outlierPoints)
        : s.lowerWhisker;

      const high = outlierPoints.length
        ? Math.max(s.upperWhisker, ...outlierPoints)
        : s.upperWhisker;

      dataMin = Math.min(dataMin, low);
      dataMax = Math.max(dataMax, high);
    }

    // Round to nearest 10
    let min = Math.floor(dataMin / 10) * 10;
    let max = Math.ceil(dataMax / 10) * 10;

    // Prevent zero-width scale
    if (min === max) {
      min -= 10;
      max += 10;
    }

    const ticks: number[] = [];
    for (let t = min; t <= max; t += 10) {
      ticks.push(t);
    }

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
          team.outliers.map((o) => `Week ${o.week}: ${o.points.toFixed(1)}`).join(', '),
      );
    }
    return lines.join('\n');
  }
}
