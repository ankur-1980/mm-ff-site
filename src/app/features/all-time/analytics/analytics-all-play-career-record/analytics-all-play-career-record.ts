import { Component, computed, inject } from '@angular/core';
import type { ChartConfiguration, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { AllPlayCareerRecordService } from './all-play-career-record.service';

const dumbbellConnectorPlugin: Plugin<'scatter'> = {
  id: 'dumbbellConnector',
  afterDatasetsDraw(chart) {
    const actualMeta = chart.getDatasetMeta(0);
    const allPlayMeta = chart.getDatasetMeta(1);
    if (!actualMeta?.data?.length || !allPlayMeta?.data?.length) return;

    const ctx = chart.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.lineWidth = 2;

    const count = Math.min(actualMeta.data.length, allPlayMeta.data.length);
    for (let i = 0; i < count; i += 1) {
      const left = actualMeta.data[i];
      const right = allPlayMeta.data[i];
      if (!left || !right) continue;
      ctx.beginPath();
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.stroke();
    }

    ctx.restore();
  },
};

@Component({
  selector: 'app-all-time-analytics-all-play-career-record',
  imports: [BaseChartDirective],
  templateUrl: './analytics-all-play-career-record.html',
  styleUrl: './analytics-all-play-career-record.scss',
})
export class AnalyticsAllPlayCareerRecord {
  private readonly service = inject(AllPlayCareerRecordService);

  protected readonly result = computed(() => this.service.buildCareerRecord());
  protected readonly chartPlugins = [dumbbellConnectorPlugin];
  protected readonly chartHeightPx = computed(() => {
    const owners = this.result()?.points.length ?? 0;
    return Math.max(420, owners * 28 + 100);
  });

  protected readonly chartData = computed<ChartConfiguration<'scatter'>['data'] | null>(() => {
    const result = this.result();
    if (!result) return null;

    const labels = result.points.map((point) => point.ownerName);
    const actualPoints = result.points.map((point, index) => ({
      x: point.actualWinPct,
      y: index,
      ownerName: point.ownerName,
      actualWinPct: point.actualWinPct,
      allPlayWinPct: point.allPlayWinPct,
    }));
    const allPlayPoints = result.points.map((point, index) => ({
      x: point.allPlayWinPct,
      y: index,
      ownerName: point.ownerName,
      actualWinPct: point.actualWinPct,
      allPlayWinPct: point.allPlayWinPct,
    }));

    return {
      datasets: [
        {
          type: 'scatter',
          label: 'Actual Win%',
          data: actualPoints,
          parsing: false,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: 'rgba(255, 152, 0, 0.9)',
          pointBorderColor: 'rgba(255, 152, 0, 1)',
          backgroundColor: 'rgba(33, 150, 243, 0.7)',
          borderWidth: 0,
          order: 2,
        },
        {
          type: 'scatter',
          label: 'All-Play Win%',
          data: allPlayPoints,
          parsing: false,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: 'rgba(33, 150, 243, 0.9)',
          pointBorderColor: 'rgba(33, 150, 243, 1)',
          backgroundColor: 'rgba(255, 152, 0, 0.7)',
          borderWidth: 0,
          order: 3,
        },
      ],
      labels,
    };
  });

  protected readonly chartOptions = computed<ChartConfiguration<'scatter'>['options']>(() => {
    const result = this.result();
    const values = result
      ? result.points.flatMap((point) => [point.allPlayWinPct, point.actualWinPct])
      : [];
    const highestWinPct = values.length ? Math.max(...values) : 0;
    const lowestWinPct = values.length ? Math.min(...values) : 0;
    const yAxisMax = Math.max(5, Math.ceil(highestWinPct / 5) * 5);
    const xAxisMin = Math.max(0, Math.floor(lowestWinPct - 5));
    const ownerLabels = result?.points.map((point) => point.ownerName) ?? [];

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            title: (items) => {
              const raw = items[0]?.raw as { ownerName?: string };
              return raw?.ownerName ? [raw.ownerName] : [];
            },
            label: (ctx) => {
              const raw = ctx.raw as { actualWinPct?: number; allPlayWinPct?: number };
              const actual = Number(raw.actualWinPct ?? 0);
              const allPlay = Number(raw.allPlayWinPct ?? 0);
              const diff = allPlay - actual;
              return [
                `Actual Win%: ${actual.toFixed(2)}%`,
                `All-Play Win%: ${allPlay.toFixed(2)}%`,
                `Gap: ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Win %' },
          min: xAxisMin,
          max: yAxisMax,
          ticks: {
            callback: (value) => `${value}%`,
          },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
        y: {
          type: 'linear',
          title: { display: true, text: 'Owner' },
          min: 0,
          max: Math.max(0, ownerLabels.length - 1),
          offset: true,
          ticks: {
            stepSize: 1,
            callback: (value) => ownerLabels[Number(value)] ?? '',
          },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
      },
    };
  });
}
