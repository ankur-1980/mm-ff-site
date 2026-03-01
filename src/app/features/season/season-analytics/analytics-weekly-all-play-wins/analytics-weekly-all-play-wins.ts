import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import type { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { SEASON_ANALYTICS_CHART_THEME } from '../chart-theme';
import { WeeklyAllPlayWinsService } from '../services/weekly-all-play-wins.service';

@Component({
  selector: 'app-analytics-weekly-all-play-wins',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './analytics-weekly-all-play-wins.html',
  styleUrl: './analytics-weekly-all-play-wins.scss',
})
export class AnalyticsWeeklyAllPlayWins {
  private readonly route = inject(ActivatedRoute);
  private readonly weeklyAllPlayService = inject(WeeklyAllPlayWinsService);

  private readonly year = toSignal(
    (this.route.parent?.parent ?? this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null)),
    ),
    { initialValue: null },
  );

  protected readonly result = computed(() => {
    const y = this.year();
    if (y == null) return null;
    return this.weeklyAllPlayService.buildWeeklyAllPlayWins(String(y));
  });

  protected readonly chartData = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const result = this.result();
    if (!result) return null;

    const sortedTeamNames = [...result.teamNames].sort((a, b) => a.localeCompare(b));
    const datasets = sortedTeamNames.map((name, i) => {
      const cumulative = result.cumulativeByTeam.get(name) ?? [];
      const color =
        SEASON_ANALYTICS_CHART_THEME.teamSeries[
          i % SEASON_ANALYTICS_CHART_THEME.teamSeries.length
        ];
      return {
        label: name,
        data: cumulative,
        borderColor: color,
        backgroundColor: `${color}26`,
        fill: false,
        spanGaps: false,
        tension: 0.2,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    return {
      labels: result.weekNumbers.map((w) => `Week ${w}`),
      datasets,
    };
  });

  protected readonly chartOptions = computed<ChartConfiguration<'line'>['options']>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: SEASON_ANALYTICS_CHART_THEME.axisText },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Week',
            color: SEASON_ANALYTICS_CHART_THEME.axisText,
          },
          ticks: { color: SEASON_ANALYTICS_CHART_THEME.axisText },
          grid: { color: SEASON_ANALYTICS_CHART_THEME.grid },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Cumulative All-Play Wins',
            color: SEASON_ANALYTICS_CHART_THEME.axisText,
          },
          ticks: {
            color: SEASON_ANALYTICS_CHART_THEME.axisText,
            stepSize: 1,
            callback: (value) => (Number.isInteger(Number(value)) ? value : ''),
          },
          grid: { color: SEASON_ANALYTICS_CHART_THEME.grid },
        },
      },
    };
  });
}
