import { Routes } from '@angular/router';

export const OWNERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./owners.page').then((m) => m.OwnersPage),
  },
  {
    path: ':ownerSlug',
    loadComponent: () =>
      import('./owner-detail.page').then((m) => m.OwnerDetailPage),
  },
  { path: '**', redirectTo: '' },
];
