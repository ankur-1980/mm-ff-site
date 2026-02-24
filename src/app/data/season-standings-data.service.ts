import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import type {
  SeasonStandingsData,
  SeasonStandingsEntry,
  SeasonStandings
} from '../models/season-standings.model';
import { LoggerService } from '@ankur-1980/logger';

const SEASON_STANDINGS_ASSET = 'assets/data/season_standings-data.json';

export type SeasonStandingsDataStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Loads season standings (end-of-year standings per season) from assets once
 * and exposes them as signal state. Single responsibility: season standings only.
 */
@Injectable({ providedIn: 'root' })
export class SeasonStandingsDataService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  private readonly status = signal<SeasonStandingsDataStatus>('idle');
  private readonly data = signal<SeasonStandingsData | null>(null);
  private readonly error = signal<string | null>(null);

  /** Current load status. */
  readonly loadStatus = this.status.asReadonly();
  /** Raw standings: season id -> owner id -> entry. null until loaded. */
  readonly seasonStandingsData = this.data.asReadonly();
  /** Error message when status is 'error'. */
  readonly loadError = this.error.asReadonly();

  /** All season ids (years) present in the data, sorted descending. */
  readonly seasonIds = computed(() => {
    const map = this.data();
    if (!map) return [];
    return Object.keys(map).sort((a, b) => Number(b) - Number(a));
  });

  /** Whether data has been loaded successfully. */
  readonly isLoaded = computed(() => this.status() === 'loaded');

  /** Whether a load is in progress or has failed (for UI). */
  readonly hasSettled = computed(
    () => this.status() === 'loaded' || this.status() === 'error'
  );

  /**
   * Load season standings from assets. Safe to call multiple times; only the first call fetches.
   */
  load(): void {
    if (this.status() !== 'idle') return;
    this.status.set('loading');
    this.error.set(null);

    this.http
      .get<SeasonStandingsData>(SEASON_STANDINGS_ASSET)
      .pipe(
        tap((payload) => {
          this.data.set(payload);
          this.status.set('loaded');
          this.logger.info(`SeasonStandingsDataService:`, payload);
          const seasonCount = Object.keys(payload).length;
          this.logger.info(
            `SeasonStandingsDataService: load complete, ${seasonCount} seasons loaded`
          );
        }),
        catchError((err: unknown) => {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to load season standings data';
          this.error.set(message);
          this.status.set('error');
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Get full standings for one season. Returns null if not loaded or season not found.
   */
  getStandingsForSeason(seasonId: string): SeasonStandings | null {
    const map = this.data();
    return map?.[seasonId] ?? null;
  }

  /**
   * Get one owner's standings entry for a season. Returns null if not loaded or not found.
   */
  getEntry(seasonId: string, ownerId: string): SeasonStandingsEntry | null {
    const season = this.getStandingsForSeason(seasonId);
    return season?.[ownerId] ?? null;
  }

  /**
   * Check if we have standings for the given season.
   */
  hasSeason(seasonId: string): boolean {
    const map = this.data();
    return map != null && seasonId in map;
  }
}
