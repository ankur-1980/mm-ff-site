import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-stat-card',
  imports: [MatCardModule, MatDividerModule],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCard {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly footer = input<string>('');
  readonly bodyAlign = input<'center' | 'start'>('center');
}
