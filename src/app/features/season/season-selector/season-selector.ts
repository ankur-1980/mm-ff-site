import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';

const YEAR_FROM_URL = /\/season\/(\d{4})/;

@Component({
  selector: 'app-season-selector',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './season-selector.html',
  styleUrl: './season-selector.scss',
})
export class SeasonSelector {
  private readonly router = inject(Router);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  /** All season years in descending order, derived from the seasons metadata map. */
  protected readonly years = computed<number[]>(() =>
    Object.keys(this.leagueMeta.seasons())
      .map(Number)
      .sort((a, b) => b - a)
  );

  /**
   * Year reflected in the current URL.
   * Watches Router events so the dropdown stays in sync with any navigation,
   * including browser back/forward and programmatic navigation.
   */
  protected readonly activeYear = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => this.yearFromUrl(e.urlAfterRedirects)),
      startWith(this.yearFromUrl(this.router.url))
    ),
    { initialValue: this.yearFromUrl(this.router.url) }
  );

  protected onYearChange(year: number): void {
    const childPath = this.childPathFromCurrentUrl();
    this.router.navigate(childPath.length > 0 ? ['/season', year, ...childPath] : ['/season', year]);
  }

  /** Path segments after /season/:year (e.g. ['analytics', 'table']) so we can stay on the same child route when year changes. */
  private childPathFromCurrentUrl(): string[] {
    const match = this.router.url.match(/\/season\/\d{4}(?:\/(.*))?$/);
    const rest = match && match[1] ? match[1].trim() : '';
    return rest ? rest.split('/').filter(Boolean) : [];
  }

  private yearFromUrl(url: string): number | null {
    const match = url.match(YEAR_FROM_URL);
    return match ? Number(match[1]) : null;
  }
}
