import { Routes } from '@angular/router';

export const ALL_TIME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./all-time.page').then((m) => m.AllTimePage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'records' },
      {
        path: 'records',
        loadComponent: () =>
          import('./records/records').then((m) => m.AllTimeRecords),
      },
      {
        path: 'head-to-head',
        loadComponent: () =>
          import('./head-to-head/head-to-head').then((m) => m.HeadToHead),
      },
      {
        path: 'all-play',
        loadComponent: () =>
          import('./all-play/all-play').then((m) => m.AllPlay),
      },
      {
        path: 'awards',
        loadComponent: () =>
          import('./awards/awards').then((m) => m.Awards),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./analytics/analytics').then((m) => m.Analytics),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'table' },
          {
            path: 'table',
            loadComponent: () =>
              import('./analytics/analytics-table/analytics-table').then(
                (m) => m.AnalyticsTable
              ),
          },
          {
            path: 'win-pct-over-time',
            loadComponent: () =>
              import(
                './analytics/analytics-win-pct-over-time/analytics-win-pct-over-time'
              ).then((m) => m.AnalyticsWinPctOverTime),
          },
          {
            path: 'total-points-for',
            loadComponent: () =>
              import(
                './analytics/analytics-total-points-for/analytics-total-points-for'
              ).then((m) => m.AnalyticsTotalPointsFor),
          },
          {
            path: 'points-differential',
            loadComponent: () =>
              import(
                './analytics/analytics-points-differential/analytics-points-differential'
              ).then((m) => m.AnalyticsPointsDifferential),
          },
          {
            path: 'expected-wins-vs-actual-wins',
            loadComponent: () =>
              import(
                './analytics/analytics-expected-wins-vs-actual-wins/analytics-expected-wins-vs-actual-wins'
              ).then((m) => m.AnalyticsExpectedWinsVsActualWins),
          },
          {
            path: 'all-play-career-record',
            loadComponent: () =>
              import(
                './analytics/analytics-all-play-career-record/analytics-all-play-career-record'
              ).then((m) => m.AnalyticsAllPlayCareerRecord),
          },
          {
            path: 'all-play-matrix',
            loadComponent: () =>
              import(
                './analytics/analytics-all-play-matrix/analytics-all-play-matrix'
              ).then((m) => m.AnalyticsAllPlayMatrix),
          },
          {
            path: 'all-play-records-table',
            loadComponent: () =>
              import(
                './analytics/analytics-all-play-records-table/analytics-all-play-records-table'
              ).then((m) => m.AnalyticsAllPlayRecordsTable),
          },
          {
            path: 'consistency-index',
            loadComponent: () =>
              import(
                './analytics/analytics-consistency-index/analytics-consistency-index'
              ).then((m) => m.AnalyticsConsistencyIndex),
          },
        ],
      },
    ],
  },
];
