import { Component } from '@angular/core';

import { AnalyticsSidebar } from './analytics-sidebar/analytics-sidebar';

@Component({
  selector: 'app-analytics',
  imports: [AnalyticsSidebar],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class Analytics {}
