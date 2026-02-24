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
            './season-power-standings/season-power-standings'
          ).then((m) => m.SeasonPowerStandings),
      },
      {
        path: 'matchups',
        loadComponent: () =>
          import(
            './season-matchups/season-matchups'
          ).then((m) => m.SeasonMatchups),
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

