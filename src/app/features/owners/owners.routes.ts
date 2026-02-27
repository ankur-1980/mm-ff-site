import { Routes } from '@angular/router';

export const OWNERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./owners.page').then((m) => m.OwnersPage),
  },
  {
    path: 'ankur',
    loadComponent: () => import('./owner-pages/ankur-owner.page').then((m) => m.AnkurOwnerPage),
  },
  {
    path: 'charlie',
    loadComponent: () => import('./owner-pages/charlie-owner.page').then((m) => m.CharlieOwnerPage),
  },
  {
    path: 'chris',
    loadComponent: () => import('./owner-pages/chris-owner.page').then((m) => m.ChrisOwnerPage),
  },
  {
    path: 'dan',
    loadComponent: () => import('./owner-pages/dan-owner.page').then((m) => m.DanOwnerPage),
  },
  {
    path: 'fancett',
    loadComponent: () => import('./owner-pages/fancett-owner.page').then((m) => m.FancettOwnerPage),
  },
  {
    path: 'greg',
    loadComponent: () => import('./owner-pages/greg-owner.page').then((m) => m.GregOwnerPage),
  },
  {
    path: 'heddle',
    loadComponent: () => import('./owner-pages/heddle-owner.page').then((m) => m.HeddleOwnerPage),
  },
  {
    path: 'josh',
    loadComponent: () => import('./owner-pages/josh-owner.page').then((m) => m.JoshOwnerPage),
  },
  {
    path: 'matt-van',
    loadComponent: () =>
      import('./owner-pages/matt-van-owner.page').then((m) => m.MattVanOwnerPage),
  },
  {
    path: 'ray',
    loadComponent: () => import('./owner-pages/ray-owner.page').then((m) => m.RayOwnerPage),
  },
  {
    path: 'robert',
    loadComponent: () => import('./owner-pages/robert-owner.page').then((m) => m.RobertOwnerPage),
  },
  {
    path: 'ron',
    loadComponent: () => import('./owner-pages/ron-owner.page').then((m) => m.RonOwnerPage),
  },
  {
    path: 'ryan',
    loadComponent: () => import('./owner-pages/ryan-owner.page').then((m) => m.RyanOwnerPage),
  },
  {
    path: 'scott',
    loadComponent: () => import('./owner-pages/scott-owner.page').then((m) => m.ScottOwnerPage),
  },
  {
    path: 'steve',
    loadComponent: () => import('./owner-pages/steve-owner.page').then((m) => m.SteveOwnerPage),
  },
  { path: '**', redirectTo: '' },
];
