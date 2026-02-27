import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import type {
  DraftRostersData,
  DraftRostersSeason,
  DraftRosterTeam,
} from '../models/draft-rosters.model';
import { LoggerService } from '@ankur-1980/logger';

const DRAFT_ROSTERS_ASSET_DIR = 'assets/data/draft-rosters';

export type DraftRostersDataStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Loads season draft rosters from per-season assets and merges them into one in-memory map.
 */
@Injectable({ providedIn: 'root' })
export class DraftRostersDataService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  private readonly status = signal<DraftRostersDataStatus>('idle');
  private readonly data = signal<DraftRostersData | null>(null);
  private readonly error = signal<string | null>(null);
  private readonly loadedSeasons = new Set<string>();
  private readonly loadingSeasons = new Set<string>();

  readonly loadStatus = this.status.asReadonly();
  readonly draftRostersData = this.data.asReadonly();
  readonly loadError = this.error.asReadonly();

  readonly seasonIds = computed(() => {
    const map = this.data();
    if (!map) return [];
    return Object.keys(map).sort((a, b) => Number(b) - Number(a));
  });

  readonly isLoaded = computed(() => this.status() === 'loaded');

  /** Load one season's draft roster from `assets/data/draft-rosters/<year>.json`. */
  loadSeason(seasonId: string): void {
    const normalizedSeasonId = String(seasonId);
    if (!normalizedSeasonId) return;
    if (
      this.loadedSeasons.has(normalizedSeasonId) ||
      this.loadingSeasons.has(normalizedSeasonId)
    ) {
      return;
    }

    this.loadingSeasons.add(normalizedSeasonId);
    this.error.set(null);
    this.status.set('loading');

    this.http
      .get<DraftRostersData>(
        `${DRAFT_ROSTERS_ASSET_DIR}/${normalizedSeasonId}.json`
      )
      .pipe(
        tap((payload) => {
          this.data.update((current) => ({ ...(current ?? {}), ...payload }));
          this.loadedSeasons.add(normalizedSeasonId);
          this.loadingSeasons.delete(normalizedSeasonId);
          this.status.set(this.loadingSeasons.size > 0 ? 'loading' : 'loaded');
        }),
        catchError((err: unknown) => {
          const message =
            err instanceof Error
              ? err.message
              : `Failed to load draft rosters data for ${normalizedSeasonId}`;
          this.logger.error('DraftRostersDataService: failed to load', err);
          this.error.set(message);
          this.loadingSeasons.delete(normalizedSeasonId);
          this.status.set(this.loadedSeasons.size > 0 ? 'loaded' : 'error');
          return of(null);
        })
      )
      .subscribe();
  }

  getRostersForSeason(seasonId: string): DraftRostersSeason | null {
    const map = this.data();
    return map?.[seasonId] ?? null;
  }

  getTeamRoster(seasonId: string, teamName: string): DraftRosterTeam | null {
    const season = this.getRostersForSeason(seasonId);
    return season?.[teamName] ?? null;
  }

  hasSeason(seasonId: string): boolean {
    const map = this.data();
    return map != null && seasonId in map;
  }
}
