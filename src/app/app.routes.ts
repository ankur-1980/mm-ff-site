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
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'season',
        loadChildren: () => import('./features/season/season.routes').then((m) => m.SEASON_ROUTES),
      },
      {
        path: 'all-time',
        loadChildren: () =>
          import('./features/all-time/all-time.routes').then((m) => m.ALL_TIME_ROUTES),
      },
      {
        path: 'owners',
        loadChildren: () => import('./features/owners/owners.routes').then((m) => m.OWNERS_ROUTES),
      },
      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
