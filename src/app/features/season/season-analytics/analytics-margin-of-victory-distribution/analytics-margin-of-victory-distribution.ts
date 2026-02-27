import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import type { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { MarginOfVictoryDistributionService } from '../services/margin-of-victory-distribution.service';

@Component({
  selector: 'app-analytics-margin-of-victory-distribution',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './analytics-margin-of-victory-distribution.html',
  styleUrl: './analytics-margin-of-victory-distribution.scss',
})
export class AnalyticsMarginOfVictoryDistribution {
  private readonly route = inject(ActivatedRoute);
  private readonly movService = inject(MarginOfVictoryDistributionService);

  private readonly year = toSignal(
    (this.route.parent?.parent ?? this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null)),
    ),
    { initialValue: null },
  );

  protected readonly distributionResult = computed(() => {
    const y = this.year();
    if (y == null) return null;
    return this.movService.buildDistribution(String(y));
  });

  protected readonly chartData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const result = this.distributionResult();
    if (!result || result.bins.length === 0) return null;

    return {
      labels: result.bins.map((b) => b.label),
      datasets: [
        {
          label: 'Frequency',
          data: result.bins.map((b) => b.count),
          backgroundColor: 'rgba(33, 150, 243, 0.7)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 1,
        },
      ],
    };
  });

  protected readonly chartOptions = computed<ChartConfiguration<'bar'>['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Games: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Margin' },
        grid: { display: false },
      },
      y: {
        title: { display: true, text: 'Frequency' },
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(0,0,0,0.08)' },
      },
    },
  }));
}
