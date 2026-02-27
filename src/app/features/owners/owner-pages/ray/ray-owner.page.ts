import { Component } from '@angular/core';

import { OwnerProfilePage } from '../../owner-profile-page/owner-profile-page';

@Component({
  selector: 'app-owner-ray-page',
  imports: [OwnerProfilePage],
  template: `
    <section class="page-section owner-detail-page" aria-label="Owner detail">
      <app-owner-profile-page ownerId="Ray" />
    </section>
  `
})
export class RayOwnerPage {}
