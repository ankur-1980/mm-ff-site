import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { HeroStat } from '../../../models/hero-stat';

@Component({
  selector: 'app-stat-card-simple',
  imports: [MatIcon],
  templateUrl: './stat-card-simple.html',
  styleUrl: './stat-card-simple.scss',
})
export class StatCardSimple {
  readonly stat = input.required<HeroStat>();
}
