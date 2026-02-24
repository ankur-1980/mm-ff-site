import { Routes } from '@angular/router';
import { AppShellComponent } from './shell/app-shell.component';
import { HomePage } from './features/home/home.page';
import { SeasonPage } from './features/season/season.page';
import { AllTimePage } from './features/all-time/all-time.page';
import { OwnersPage } from './features/owners/owners.page';
import { RecordsPage } from './features/records/records.page';
import { NotFoundPage } from './features/not-found/not-found.page';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: HomePage },
      { path: 'season', component: SeasonPage },
      { path: 'all-time', component: AllTimePage },
      { path: 'owners', component: OwnersPage },
      { path: 'records', component: RecordsPage },
      { path: '**', component: NotFoundPage }
    ]
  }
];

