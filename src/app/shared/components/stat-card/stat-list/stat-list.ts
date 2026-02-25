import { Component, input } from '@angular/core';

export interface StatListItem {
  label: string;
  value?: string | number;
}

@Component({
  selector: 'app-stat-list',
  imports: [],
  templateUrl: './stat-list.html',
  styleUrl: './stat-list.scss',
})
export class StatList {
  readonly items = input.required<StatListItem[]>();
}
