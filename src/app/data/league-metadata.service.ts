import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import type { LeagueMetaData, SeasonMetaData } from '../models/league-metadata.model';
import { LoggerService } from '@ankur-1980/logger';

const LEAGUE_ASSET = 'assets/data/league-metadata.json';

export type LeagueDataStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Loads league metadata from assets once and exposes it as signal state.
 * Exposes status, data, and error for loading/error/league name UI.
 */
@Injectable({ providedIn: 'root' })
export class LeagueMetaDataService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  private readonly status = signal<LeagueDataStatus>('idle');
  private readonly data = signal<LeagueMetaData | null>(null);
  private readonly error = signal<string | null>(null);

  /** Current load status. */
  readonly loadStatus = this.status.asReadonly();
  /** League data when loaded. null until loaded or on error. */
  readonly leagueData = this.data.asReadonly();
  /** Error message when status is 'error'. */
  readonly loadError = this.error.asReadonly();

  /** Whether data has been loaded successfully. */
  readonly isLoaded = computed(() => this.status() === 'loaded');

  /** Whether a load is in progress or has failed (for UI). */
  readonly hasSettled = computed(
    () => this.status() === 'loaded' || this.status() === 'error'
  );

  /** Current season id from meta (e.g. "2025"). null if not set or not loaded. */
  readonly currentSeasonId = computed(() => this.data()?.currentSeasonId ?? null);

  /** All known season metadata keyed by year string. */
  readonly seasons = computed<Record<string, SeasonMetaData>>(
    () => this.data()?.seasons ?? {}
  );

  /** Metadata for a specific season year (number or string). */
  getSeasonMeta(seasonId: number | string): SeasonMetaData | null {
    const key = String(seasonId);
    const map = this.seasons();
    return map[key] ?? null;
  }

  /**
   * Load league from assets. Safe to call multiple times; only the first call fetches.
   */
  load(): void {
    if (this.status() !== 'idle') return;
    this.status.set('loading');
    this.error.set(null);

    this.http
      .get<LeagueMetaData>(LEAGUE_ASSET)
      .pipe(
        tap((payload) => {
          this.data.set(payload);
          this.status.set('loaded');
          this.logger.info(
            `LeagueDataService: load complete, league "${payload.name}"`
          );
        }),
        catchError((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Failed to load league data';
          this.error.set(message);
          this.status.set('error');
          return of(null);
        })
      )
      .subscribe();
  }
}
