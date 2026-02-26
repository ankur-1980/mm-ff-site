import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface StarterGameListItem {
  value: string | number;
  weekLabel?: string;
  playerDetails?: string;
  teamName: string;
}

@Component({
  selector: 'app-starter-game-list',
  imports: [DecimalPipe],
  templateUrl: './starter-game-list.html',
  styleUrl: './starter-game-list.scss',
})
export class StarterGameList {
  readonly items = input.required<StarterGameListItem[]>();
  readonly showWeek = input<boolean>(true);
  readonly showDetails = input<boolean>(true);
  readonly truncateText = input<boolean>(true);
}
