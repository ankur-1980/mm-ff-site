import { Component } from '@angular/core';

import { OwnerProfileCard } from '../../../../shared/components/owner-profile-card/owner-profile-card';

@Component({
  selector: 'app-owner-matt-van-page',
  imports: [OwnerProfileCard],
  template: `
    <section class="page-section owner-detail-page" aria-label="Owner detail">
      <app-owner-profile-card ownerId="Matt Van" />
    </section>
  `
})
export class MattVanOwnerPage {}
