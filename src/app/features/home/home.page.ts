import { Component, inject } from '@angular/core';

import { LeagueDataService } from '../../data/league-data.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  protected readonly leagueData = inject(LeagueDataService);
}
