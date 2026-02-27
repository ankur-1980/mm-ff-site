import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';

import { OwnersDataService } from '../../data/owners-data.service';
import { OwnerProfilePage } from './owner-profile-page/owner-profile-page';
import { toOwnerSlug } from './owners.utils';

@Component({
  selector: 'app-owner-detail-page',
  imports: [RouterLink, OwnerProfilePage],
  template: `
    @if (ownerId(); as resolvedOwnerId) {
      <section class="page-section owner-detail-page" aria-label="Owner detail">
        <app-owner-profile-page [ownerId]="resolvedOwnerId" />
      </section>
    } @else {
      <section class="page-section owner-detail-page" aria-labelledby="owner-not-found-heading">
        <h1 id="owner-not-found-heading">Owner not found</h1>
        <a [routerLink]="['/owners']">Back to Owners</a>
      </section>
    }
  `,
})
export class OwnerDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly ownersData = inject(OwnersDataService);

  private readonly ownerSlug = toSignal(
    this.route.params.pipe(map((params) => params['ownerSlug'] ?? null)),
    { initialValue: null }
  );

  protected readonly ownerId = computed(() => {
    const slug = this.ownerSlug();
    if (!slug) return null;

    const owner = this.ownersData
      .allOwners()
      .find((candidate) => toOwnerSlug(candidate.managerName) === slug);

    return owner?.managerName ?? null;
  });
}
