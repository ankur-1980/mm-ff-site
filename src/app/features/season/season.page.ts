import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SeasonSelector } from './season-selector/season-selector';

@Component({
  selector: 'app-season-page',
  imports: [SeasonSelector, RouterOutlet],
  templateUrl: './season.page.html',
  styleUrl: './season.page.scss'
})
export class SeasonPage {}
