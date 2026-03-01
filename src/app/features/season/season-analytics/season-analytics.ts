import { Component } from '@angular/core';

import { AnalyticsSidebar } from './analytics-sidebar/analytics-sidebar';
import { SubsectionHeader } from '../../../shared/components/subsection-header/subsection-header';

@Component({
  selector: 'app-season-analytics',
  imports: [AnalyticsSidebar, SubsectionHeader],
  templateUrl: './season-analytics.html',
  styleUrl: './season-analytics.scss',
})
export class SeasonAnalytics {}
