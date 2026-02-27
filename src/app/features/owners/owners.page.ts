import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SectionHeader } from '../../shared/components/section-header/section-header';
import { OWNER_TABS } from './owners-tabs';

@Component({
  selector: 'app-owners-page',
  imports: [SectionHeader, RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
  templateUrl: './owners.page.html',
  styleUrl: './owners.page.scss'
})
export class OwnersPage {
  protected readonly tabs = OWNER_TABS;
}
