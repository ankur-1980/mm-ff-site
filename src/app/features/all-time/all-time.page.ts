import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SectionHeader } from '../../shared/components/section-header/section-header';

interface AllTimeTab {
  path: string;
  label: string;
}

const ALL_TIME_TABS: AllTimeTab[] = [
  { path: 'records', label: 'Records' },
  { path: 'all-play', label: 'All-Play' },
  { path: 'awards', label: 'Awards' },
  { path: 'analytics', label: 'Analytics' },
];

@Component({
  selector: 'app-all-time-page',
  imports: [SectionHeader, RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
  templateUrl: './all-time.page.html',
  styleUrl: './all-time.page.scss',
})
export class AllTimePage {
  protected readonly tabs = ALL_TIME_TABS;
}
