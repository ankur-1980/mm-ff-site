import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export type StatListValueFormat = 'auto' | 'decimal2' | 'integer';
export interface StatListItem {
  id: string | number;
  value: string | number;
  weekLabel?: string;
  playerDetails?: string;
  teamName: string;
}

@Component({
  selector: 'app-stat-list',
  imports: [DecimalPipe],
  templateUrl: './stat-list.html',
  styleUrl: './stat-list.scss',
})
export class StatList {
  readonly items = input.required<StatListItem[]>();
  readonly showWeek = input<boolean>(true);
  readonly showDetails = input<boolean>(true);
  readonly truncateText = input<boolean>(true);
  readonly valueFormat = input<StatListValueFormat>('auto');
  readonly weekPrefix = input<string>('Week');
}
