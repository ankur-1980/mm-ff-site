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
      },
    ],
  },
];
