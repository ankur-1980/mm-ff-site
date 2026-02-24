import { Component, inject } from '@angular/core';

import { LeagueMetaDataFacade } from '../../data';
import { HeroComponent } from './hero/hero.component';
import { StandingsPreviewComponent } from './standings-preview/standings-preview.component';

@Component({
  selector: 'app-home-page',
  imports: [HeroComponent, StandingsPreviewComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  protected readonly leagueData = inject(LeagueMetaDataFacade);
}
