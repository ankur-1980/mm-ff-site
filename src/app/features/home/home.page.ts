import { Component, inject } from '@angular/core';

import { LeagueDataService } from '../../data';
import { HeroComponent } from './hero/hero.component';

@Component({
  selector: 'app-home-page',
  imports: [HeroComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  protected readonly leagueData = inject(LeagueDataService);
}
