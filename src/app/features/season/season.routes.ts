import { Routes } from '@angular/router';

export const SEASON_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./season-redirect').then((m) => m.SeasonRedirectComponent),
  },
  {
    path: ':year',
    loadComponent: () =>
      import('./season.page').then((m) => m.SeasonPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'standings' },
      {
        path: 'standings',
        loadComponent: () =>
          import(
            './season-standings/season-standings'
          ).then((m) => m.SeasonStandings),
      },
      {
        path: 'matchups',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'week1' },
          {
            path: ':week',
            loadComponent: () =>
              import('./season-matchups/season-matchups').then(
                (m) => m.SeasonMatchups
              ),
          },
        ],
      },
      {
        path: 'power-rankings',
        loadComponent: () =>
          import(
            './season-power-rankings/season-power-rankings'
          ).then((m) => m.SeasonPowerRankings),
      },
      {
        path: 'awards',
        loadComponent: () =>
          import('./season-awards/season-awards').then(
            (m) => m.SeasonAwards
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./season-analytics/season-analytics').then(
            (m) => m.SeasonAnalytics
          ),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'table' },
          {
            path: 'table',
            loadComponent: () =>
              import('./season-analytics/analytics-table/analytics-table').then(
                (m) => m.AnalyticsTable
              ),
          },
          {
            path: 'all-play-matrix',
            loadComponent: () =>
              import(
                './season-analytics/analytics-all-play-matrix/analytics-all-play-matrix'
              ).then((m) => m.AnalyticsAllPlayMatrix),
          },
          {
            path: 'weekly-rank-trajectory',
            loadComponent: () =>
              import(
                './season-analytics/analytics-weekly-rank-trajectory/analytics-weekly-rank-trajectory'
              ).then((m) => m.AnalyticsWeeklyRankTrajectory),
          },
        ],
      },
      {
        path: 'draft',
        loadComponent: () =>
          import('./season-draft/season-draft').then(
            (m) => m.SeasonDraft
          ),
      },
    ],
  },
];

