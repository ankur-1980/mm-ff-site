import { Routes } from '@angular/router';
import { AppShellComponent } from './shell/app-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.page').then((m) => m.HomePage)
      },
      {
        path: 'season',
        loadComponent: () =>
          import('./features/season/season.page').then((m) => m.SeasonPage)
      },
      {
        path: 'all-time',
        loadComponent: () =>
          import('./features/all-time/all-time.page').then(
            (m) => m.AllTimePage
          )
      },
      {
        path: 'owners',
        loadComponent: () =>
          import('./features/owners/owners.page').then((m) => m.OwnersPage)
      },
      {
        path: 'records',
        loadComponent: () =>
          import('./features/records/records.page').then((m) => m.RecordsPage)
      },
      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/not-found.page').then(
            (m) => m.NotFoundPage
          )
      }
    ]
  }
];
