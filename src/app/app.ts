import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LeagueMetaDataFacade } from './data';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly leagueData = inject(LeagueMetaDataFacade);

  ngOnInit(): void {
    this.leagueData.loadAll();
  }
}
