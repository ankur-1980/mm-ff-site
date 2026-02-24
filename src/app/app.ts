import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoggerService } from '@ankur-1980/logger';
import { OwnersDataService } from './data/owners-data.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private logger = inject(LoggerService)
  private ownersDataService = inject(OwnersDataService);
  protected readonly title = signal('midwest-madness');

  ngOnInit(): void {
    this.logger.info('App initialized');
    this.ownersDataService.load();
  }
}
