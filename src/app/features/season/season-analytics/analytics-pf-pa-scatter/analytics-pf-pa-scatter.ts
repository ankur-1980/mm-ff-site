import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import type { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { PfPaScatterService } from '../pf-pa-scatter.service';
import {
  pfPaScatterLinesPlugin,
  pfPaScatterLabelsPlugin,
} from './pf-pa-scatter-chart.plugin';

@Component({
  selector: 'app-analytics-pf-pa-scatter',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './analytics-pf-pa-scatter.html',
  styleUrl: './analytics-pf-pa-scatter.scss',
})
export class AnalyticsPfPaScatter {
  private readonly route = inject(ActivatedRoute);
  private readonly scatterService = inject(PfPaScatterService);

  private readonly year = toSignal(
    (this.route.parent?.parent ?? this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null))
    ),
    { initialValue: null }
  );

  protected readonly scatterResult = computed(() => {
    const y = this.year();
    if (y == null) return null;
    return this.scatterService.buildScatterData(String(y));
  });

  protected readonly chartData = computed<ChartConfiguration<'scatter'>['data'] | null>(() => {
    const result = this.scatterResult();
    if (!result) return null;

    const teamData = result.points.map((p) => ({
      x: p.x,
      y: p.y,
      abbrev: p.abbrev,
      pointsFor: p.pointsFor,
      pointsAgainst: p.pointsAgainst,
      expectedWins: p.expectedWins,
      actualWins: p.actualWins,
      luck: p.luck,
    }));

    return {
      datasets: [
        {
          type: 'scatter',
          label: 'Teams',
          data: teamData,
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
              const raw = items[0]?.raw as { abbrev?: string };
              return raw?.abbrev ? [raw.abbrev] : [];
            },
            label: (ctx) => {
              const raw = ctx.raw as {
                pointsFor?: number;
                pointsAgainst?: number;
                expectedWins?: number;
                luck?: number;
              };
              const pf = raw?.pointsFor ?? ctx.parsed.x;
              const pa = raw?.pointsAgainst ?? ctx.parsed.y;
              const exp = raw?.expectedWins;
              const luck = raw?.luck;
              const parts = [
                `PF: ${Number(pf).toFixed(1)}`,
                `PA: ${Number(pa).toFixed(1)}`,
              ];
              if (exp != null) parts.push(`Expected Wins: ${Number(exp).toFixed(2)}`);
              if (luck != null) parts.push(`Luck: ${luck >= 0 ? '+' : ''}${Number(luck).toFixed(2)}`);
              return parts;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: axisMin,
          max: axisMax,
          title: { display: true, text: 'Points For (PF)' },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
        y: {
          type: 'linear',
          min: axisMin,
          max: axisMax,
          title: { display: true, text: 'Points Against (PA)' },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
      },
    };
  });

  protected readonly chartPlugins = [pfPaScatterLinesPlugin, pfPaScatterLabelsPlugin];
}
