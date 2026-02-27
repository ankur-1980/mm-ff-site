import { Component, computed, inject } from '@angular/core';
import type { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { WinPctOverTimeService } from './win-pct-over-time.service';

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
  imports: [BaseChartDirective],
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
          labels: { boxWidth: 14, boxHeight: 4, usePointStyle: false },
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
          title: { display: true, text: 'Season' },
          ticks: { autoSkip: true, maxTicksLimit: 12 },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
        y: {
          title: { display: true, text: 'Season Win %' },
          min: 0,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
          },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
      },
    };
  });
}
