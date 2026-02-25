import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-value',
  imports: [],
  templateUrl: './stat-value.html',
  styleUrl: './stat-value.scss',
})
export class StatValue {
  readonly context = input<string>('');
  readonly value = input.required<string | number>();
  readonly subscript = input<string>('');
}
