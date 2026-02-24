import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';

@Component({
  selector: 'app-season-selector',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './season-selector.html',
  styleUrl: './season-selector.scss',
})
export class SeasonSelector {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  /** All season years in descending order */
  protected readonly years = computed<number[]>(() =>
    Object.keys(this.leagueMeta.seasons())
      .map(Number)
      .sort((a, b) => b - a)
  );

  /** Year currently shown in the URL. */
  protected readonly activeYear = toSignal(
    this.route.params.pipe(map((p) => (p['year'] ? Number(p['year']) : null))),
    { initialValue: null }
  );

  protected onYearChange(year: number): void {
    this.router.navigate(['/season', year, 'standings']);
  }
}
