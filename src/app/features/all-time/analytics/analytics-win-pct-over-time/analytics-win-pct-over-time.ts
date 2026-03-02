import { Component, computed, inject } from '@angular/core';
import type { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { SEASON_ANALYTICS_CHART_THEME } from '../../../season/season-analytics/chart-theme';
import { WinPctOverTimeService } from './win-pct-over-time.service';
import { SubsectionHeader } from '../../../../shared/components/subsection-header/subsection-header';

function ownerColor(index: number): { stroke: string; fill: string } {
  const hue = (index * 137.508) % 360;
  const saturation = 64 + (index % 3) * 8;
  const lightness = 36 + (index % 4) * 6;
  return {
    stroke: `hsl(${hue.toFixed(1)} ${saturation}% ${lightness}%)`,
    fill: `hsl(${hue.toFixed(1)} ${saturation}% ${lightness}% / 0.15)`,
  };
}

@Component({
  selector: 'app-all-time-analytics-win-pct-over-time',
  imports: [BaseChartDirective, SubsectionHeader],
  templateUrl: './analytics-win-pct-over-time.html',
  styleUrl: './analytics-win-pct-over-time.scss',
})
export class AnalyticsWinPctOverTime {
  private readonly service = inject(WinPctOverTimeService);

  protected readonly result = computed(() => this.service.buildSeasonalWinPctSeries());

  protected readonly chartData = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const result = this.result();
    if (!result) return null;

    return {
      labels: result.seasons.map((season) => String(season)),
      datasets: result.series.map((ownerSeries, index) => {
        const color = ownerColor(index);
        return {
          label: ownerSeries.ownerName,
          data: ownerSeries.points.map((point) => (point ? point.winPct : null)),
          borderColor: color.stroke,
          backgroundColor: color.fill,
          fill: false,
          spanGaps: true,
          tension: 0.15,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 5,
        };
      }),
    };
  });

  protected readonly chartOptions = computed<ChartConfiguration<'line'>['options']>(() => {
    const result = this.result();

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'nearest' },
      elements: {
        line: { spanGaps: true },
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 14,
            boxHeight: 4,
            usePointStyle: false,
            color: SEASON_ANALYTICS_CHART_THEME.axisText,
          },
        },
        tooltip: {
          callbacks: {
            title: (items) => {
              const year = items[0]?.label;
              return year ? [`Season ${year}`] : [];
            },
            label: (ctx) => {
              const ownerName = String(ctx.dataset.label ?? 'Owner');
              const series = result?.series.find((row) => row.ownerName === ownerName);
              const point = series?.points[ctx.dataIndex] ?? null;
              if (!point) return `${ownerName}: did not play`;
              return `${ownerName}: ${point.winPct.toFixed(2)}% (${point.wins}-${point.losses}-${point.ties})`;
            },
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Season', color: SEASON_ANALYTICS_CHART_THEME.axisText },
          ticks: {
            color: SEASON_ANALYTICS_CHART_THEME.axisText,
            autoSkip: true,
            maxTicksLimit: 12,
          },
          grid: { color: SEASON_ANALYTICS_CHART_THEME.grid },
        },
        y: {
          title: {
            display: true,
            text: 'Season Win %',
            color: SEASON_ANALYTICS_CHART_THEME.axisText,
          },
          min: 0,
          max: 100,
          ticks: {
            color: SEASON_ANALYTICS_CHART_THEME.axisText,
            callback: (value) => `${value}%`,
          },
          grid: { color: SEASON_ANALYTICS_CHART_THEME.grid },
        },
      },
    };
  });
}
