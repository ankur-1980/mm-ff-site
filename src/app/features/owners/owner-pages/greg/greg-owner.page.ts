import { Component } from '@angular/core';

import { OwnerProfileCard } from '../../../../shared/components/owner-profile-card/owner-profile-card';

@Component({
  selector: 'app-owner-greg-page',
  imports: [OwnerProfileCard],
  template: `
    <section class="page-section owner-detail-page" aria-label="Owner detail">
      <app-owner-profile-card ownerId="Greg" />
    </section>
  `
})
export class GregOwnerPage {}
