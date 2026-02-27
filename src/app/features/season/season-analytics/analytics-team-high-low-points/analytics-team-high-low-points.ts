import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import type { ChartConfiguration, Plugin } from 'chart.js';
import { map } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';

import { TeamHighLowPointsService } from '../services/team-high-low-points.service';

const teamHighLowConnectorPlugin: Plugin<'line'> = {
  id: 'teamHighLowConnector',
  afterDatasetsDraw(chart) {
    const lowMeta = chart.getDatasetMeta(0);
    const highMeta = chart.getDatasetMeta(1);
    if (!lowMeta?.data?.length || !highMeta?.data?.length) return;

    const ctx = chart.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.lineWidth = 2;

    const count = Math.min(lowMeta.data.length, highMeta.data.length);
    for (let i = 0; i < count; i += 1) {
      const lowPoint = lowMeta.data[i];
      const highPoint = highMeta.data[i];
      if (!lowPoint || !highPoint) continue;

      ctx.beginPath();
      ctx.moveTo(lowPoint.x, lowPoint.y);
      ctx.lineTo(highPoint.x, highPoint.y);
      ctx.stroke();
    }

    ctx.restore();
  },
};

@Component({
  selector: 'app-analytics-team-high-low-points',
  imports: [BaseChartDirective],
  templateUrl: './analytics-team-high-low-points.html',
  styleUrl: './analytics-team-high-low-points.scss',
})
export class AnalyticsTeamHighLowPoints {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(TeamHighLowPointsService);

  private readonly year = toSignal(
    (this.route.parent?.parent ?? this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null)),
    ),
    { initialValue: null },
  );

  protected readonly result = computed(() => {
    const y = this.year();
    if (y == null) return null;
    return this.service.buildTeamHighLowPoints(String(y));
  });

  protected readonly chartPlugins = [teamHighLowConnectorPlugin];

  protected readonly chartData = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const result = this.result();
    if (!result) return null;

    return {
      labels: result.points.map((point) => point.teamName),
      datasets: [
        {
          type: 'line',
          label: 'Season Low',
          data: result.points.map((point) => point.minPoints),
          showLine: false,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: 'rgba(239, 68, 68, 0.9)',
          pointBorderColor: 'rgba(239, 68, 68, 1)',
          order: 2,
        },
        {
          type: 'line',
          label: 'Season High',
          data: result.points.map((point) => point.maxPoints),
          showLine: false,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: 'rgba(37, 99, 235, 0.9)',
          pointBorderColor: 'rgba(37, 99, 235, 1)',
          order: 3,
        },
      ],
    };
  });

  protected readonly chartOptions = computed<ChartConfiguration<'line'>['options']>(() => {
    const result = this.result();
    if (!result) return { responsive: true, maintainAspectRatio: false };

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            title: (items) => {
              const teamName = items[0]?.label;
              return teamName ? [teamName] : [];
            },
            label: (ctx) => {
              const low = Number(this.result()?.points[ctx.dataIndex]?.minPoints ?? 0);
              const high = Number(this.result()?.points[ctx.dataIndex]?.maxPoints ?? 0);
              const range = high - low;

              return [
                `High: ${high.toFixed(2)}`,
                `Low: ${low.toFixed(2)}`,
                `Range: ${range.toFixed(2)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          type: 'category',
          title: { display: true, text: 'Team' },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
        y: {
          type: 'linear',
          min: result.axisMin,
          max: result.axisMax,
          title: { display: true, text: 'Points' },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
      },
    };
  });
}
