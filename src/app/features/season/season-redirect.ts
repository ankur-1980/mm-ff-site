import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { LeagueMetaDataFacade } from '../../data';

@Component({
  selector: 'app-season-redirect',
  template: '',
})
export class SeasonRedirectComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly league = inject(LeagueMetaDataFacade);

  ngOnInit(): void {
    const current = this.league.currentSeason();
    const year = current?.id ?? new Date().getFullYear();
    this.router.navigate(['/season', year, 'standings']);
  }
}

