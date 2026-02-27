import { Component } from '@angular/core';

import { OwnerProfilePage } from '../../owner-profile-page/owner-profile-page';

@Component({
  selector: 'app-owner-ryan-page',
  imports: [OwnerProfilePage],
  template: `
    <section class="page-section owner-detail-page" aria-label="Owner detail">
      <app-owner-profile-page ownerId="Ryan" />
    </section>
  `
})
export class RyanOwnerPage {}
