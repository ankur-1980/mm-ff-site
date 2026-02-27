import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SectionHeader } from '../../shared/components/section-header/section-header';
import { OwnerProfileCard } from '../../shared/components/owner-profile-card/owner-profile-card';
import { OWNER_TABS } from './owners-tabs';

@Component({
  selector: 'app-owners-page',
  imports: [SectionHeader, RouterLink, OwnerProfileCard],
  templateUrl: './owners.page.html',
  styleUrl: './owners.page.scss'
})
export class OwnersPage {
  protected readonly ownerCards = OWNER_TABS;
  protected readonly subtitle = ['#Active Owners', '# Owners All-Time'];
}
