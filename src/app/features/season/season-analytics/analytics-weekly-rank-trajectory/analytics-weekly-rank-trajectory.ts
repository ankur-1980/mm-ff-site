import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import type { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { SEASON_ANALYTICS_CHART_THEME } from '../chart-theme';
import { WeeklyRankTrajectoryService } from '../services/weekly-rank-trajectory.service';

@Component({
  selector: 'app-analytics-weekly-rank-trajectory',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './analytics-weekly-rank-trajectory.html',
  styleUrl: './analytics-weekly-rank-trajectory.scss',
})
export class AnalyticsWeeklyRankTrajectory {
  private readonly route = inject(ActivatedRoute);
  private readonly trajectoryService = inject(WeeklyRankTrajectoryService);

  private readonly year = toSignal(
    (this.route.parent?.parent ?? this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null)),
    ),
    { initialValue: null },
  );

  protected readonly chartData = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const y = this.year();
    if (y == null) return null;
    const result = this.trajectoryService.buildTrajectory(String(y));
    if (!result) return null;

    const sortedTeamNames = [...result.teamNames].sort((a, b) => a.localeCompare(b));
    const datasets = sortedTeamNames.map((name, i) => {
      const ranks = result.rankByTeam.get(name) ?? [];
      const color =
        SEASON_ANALYTICS_CHART_THEME.teamSeries[
          i % SEASON_ANALYTICS_CHART_THEME.teamSeries.length
        ];
      return {
        label: name,
        data: ranks as number[],
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
    const result = this.chartData();
    const maxRank = result?.datasets?.length ?? 10;
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
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => {
              const v = ctx.parsed.y;
              return v != null ? `Rank: ${v}` : '';
            },
          },
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
          reverse: true,
          min: 1,
          max: Math.max(maxRank, 10),
          title: {
            display: true,
            text: 'Rank',
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
