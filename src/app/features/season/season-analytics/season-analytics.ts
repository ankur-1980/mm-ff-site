import { Component } from '@angular/core';

import { AnalyticsSidebar } from './analytics-sidebar/analytics-sidebar';

@Component({
  selector: 'app-season-analytics',
  imports: [AnalyticsSidebar],
  templateUrl: './season-analytics.html',
  styleUrl: './season-analytics.scss',
})
export class SeasonAnalytics {}
