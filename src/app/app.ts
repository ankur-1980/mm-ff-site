import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LeagueDataFacade } from './data';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly leagueData = inject(LeagueDataFacade);

  ngOnInit(): void {
    this.leagueData.loadAll();
  }
}
