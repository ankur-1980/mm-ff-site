import { Component, computed, inject } from '@angular/core';
import type { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import {
  pfPaScatterLabelsPlugin,
  pfPaScatterLinesPlugin,
} from '../../../season/season-analytics/analytics-pf-pa-scatter/pf-pa-scatter-chart.plugin';
import { PointsDifferentialScatterService } from './points-differential-scatter.service';

@Component({
  selector: 'app-all-time-analytics-points-differential',
  imports: [BaseChartDirective],
  templateUrl: './analytics-points-differential.html',
  styleUrl: './analytics-points-differential.scss',
})
export class AnalyticsPointsDifferential {
  private readonly scatterService = inject(PointsDifferentialScatterService);

  protected readonly scatterResult = computed(() => this.scatterService.buildCareerScatter());

  protected readonly chartData = computed<ChartConfiguration<'scatter'>['data'] | null>(() => {
    const result = this.scatterResult();
    if (!result) return null;

    return {
      datasets: [
        {
          type: 'scatter',
          label: 'Owners',
          data: result.points.map((point) => ({
            x: point.x,
            y: point.y,
            ownerName: point.ownerName,
            abbrev: point.abbrev,
            totalPointsFor: point.totalPointsFor,
            totalPointsAgainst: point.totalPointsAgainst,
            expectedWins: point.expectedWins,
            actualWins: point.actualWins,
            luck: point.luck,
          })),
          backgroundColor: 'rgba(33, 150, 243, 0.7)',
          borderColor: 'rgba(33, 150, 243, 1)',
          pointRadius: 8,
          pointHoverRadius: 10,
          order: 1,
        },
      ],
    };
  });

  protected readonly chartOptions = computed<ChartConfiguration<'scatter'>['options']>(() => {
    const result = this.scatterResult();
    if (!result) return { responsive: true, maintainAspectRatio: false };

    const { avgPF, avgPA, axisMin, axisMax } = result;
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { right: 80 } },
      plugins: {
        pfPaScatter: { avgPF, avgPA, axisMin, axisMax },
        tooltip: {
          callbacks: {
            title: (items) => {
              const raw = items[0]?.raw as { ownerName?: string };
              return raw?.ownerName ? [raw.ownerName] : [];
            },
            label: (ctx) => {
              const raw = ctx.raw as {
                totalPointsFor?: number;
                totalPointsAgainst?: number;
                expectedWins?: number;
                luck?: number;
              };
              const pf = Number(raw?.totalPointsFor ?? ctx.parsed.x);
              const pa = Number(raw?.totalPointsAgainst ?? ctx.parsed.y);
              const expectedWins = Number(raw?.expectedWins ?? 0);
              const luck = Number(raw?.luck ?? 0);

              return [
                `Total PF: ${pf.toFixed(2)}`,
                `Total PA: ${pa.toFixed(2)}`,
                `Expected Wins: ${expectedWins.toFixed(2)}`,
                `Career Luck: ${luck >= 0 ? '+' : ''}${luck.toFixed(2)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: axisMin,
          max: axisMax,
          title: { display: true, text: 'Total PF' },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
        y: {
          type: 'linear',
          min: axisMin,
          max: axisMax,
          title: { display: true, text: 'Total PA' },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
      },
    };
  });

  protected readonly chartPlugins = [pfPaScatterLinesPlugin, pfPaScatterLabelsPlugin];
}
