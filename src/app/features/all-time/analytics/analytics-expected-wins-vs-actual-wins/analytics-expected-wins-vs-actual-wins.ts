import { Component, computed, inject } from '@angular/core';
import type { ChartConfiguration, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { SEASON_ANALYTICS_CHART_THEME } from '../../../season/season-analytics/chart-theme';
import { ExpectedWinsVsActualWinsService } from './expected-wins-vs-actual-wins.service';
import { SubsectionHeader } from '../../../../shared/components/subsection-header/subsection-header';

const parityLinePlugin: Plugin<'scatter'> = {
  id: 'expectedActualParityLine',
  afterDraw(chart) {
    const xScale = chart.scales['x'];
    const yScale = chart.scales['y'];
    if (!xScale || !yScale) return;

    const min = Math.max(Number(xScale.min ?? 0), Number(yScale.min ?? 0));
    const max = Math.min(Number(xScale.max ?? 0), Number(yScale.max ?? 0));
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return;

    const ctx = chart.ctx;
    ctx.save();
    ctx.strokeStyle = SEASON_ANALYTICS_CHART_THEME.referenceLineStrong;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(xScale.getPixelForValue(min), yScale.getPixelForValue(min));
    ctx.lineTo(xScale.getPixelForValue(max), yScale.getPixelForValue(max));
    ctx.stroke();
    ctx.restore();
  },
};

@Component({
  selector: 'app-all-time-analytics-expected-wins-vs-actual-wins',
  imports: [BaseChartDirective, SubsectionHeader],
  templateUrl: './analytics-expected-wins-vs-actual-wins.html',
  styleUrl: './analytics-expected-wins-vs-actual-wins.scss',
})
export class AnalyticsExpectedWinsVsActualWins {
  private readonly service = inject(ExpectedWinsVsActualWinsService);

  protected readonly result = computed(() => this.service.buildCareerData());

  protected readonly chartData = computed<ChartConfiguration<'scatter'>['data'] | null>(() => {
    const result = this.result();
    if (!result) return null;

    return {
      datasets: [
        {
          type: 'scatter',
          label: 'Owners',
          data: result.points.map((point) => ({
            x: point.expectedWins,
            y: point.actualWins,
            ownerName: point.ownerName,
            careerLuck: point.careerLuck,
          })),
          backgroundColor: SEASON_ANALYTICS_CHART_THEME.primaryFill,
          borderColor: SEASON_ANALYTICS_CHART_THEME.primary,
          pointRadius: 7,
          pointHoverRadius: 9,
        },
      ],
    };
  });

  protected readonly chartOptions = computed<ChartConfiguration<'scatter'>['options']>(() => {
    const result = this.result();
    if (!result) return { responsive: true, maintainAspectRatio: false };

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: SEASON_ANALYTICS_CHART_THEME.axisText },
        },
        tooltip: {
          callbacks: {
            title: (items) => {
              const raw = items[0]?.raw as { ownerName?: string };
              return raw?.ownerName ? [raw.ownerName] : [];
            },
            label: (ctx) => {
              const raw = ctx.raw as { careerLuck?: number };
              const luck = Number(raw?.careerLuck ?? 0);
              const formattedLuck = `${luck >= 0 ? '+' : ''}${luck.toFixed(2)}`;
              const expectedWins = Number(ctx.parsed.x ?? 0);
              const actualWins = Number(ctx.parsed.y ?? 0);
              return [
                `Expected Wins: ${expectedWins.toFixed(2)}`,
                `Actual Wins: ${actualWins.toFixed(0)}`,
                `Career Luck: ${formattedLuck}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: result.axisMin,
          max: result.axisMax,
          title: {
            display: true,
            text: 'Expected Wins',
            color: SEASON_ANALYTICS_CHART_THEME.axisText,
          },
          ticks: { color: SEASON_ANALYTICS_CHART_THEME.axisText },
          grid: { color: SEASON_ANALYTICS_CHART_THEME.grid },
        },
        y: {
          type: 'linear',
          min: result.axisMin,
          max: result.axisMax,
          title: {
            display: true,
            text: 'Actual Wins',
            color: SEASON_ANALYTICS_CHART_THEME.axisText,
          },
          ticks: { color: SEASON_ANALYTICS_CHART_THEME.axisText },
          grid: { color: SEASON_ANALYTICS_CHART_THEME.grid },
        },
      },
    };
  });

  protected readonly chartPlugins = [parityLinePlugin];
}
