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

const DRAFT_ROSTERS_ASSET = 'assets/data/draft_rosters.json';

export type DraftRostersDataStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Loads season draft rosters from assets once and exposes them as signal state.
 */
@Injectable({ providedIn: 'root' })
export class DraftRostersDataService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  private readonly status = signal<DraftRostersDataStatus>('idle');
  private readonly data = signal<DraftRostersData | null>(null);
  private readonly error = signal<string | null>(null);

  readonly loadStatus = this.status.asReadonly();
  readonly draftRostersData = this.data.asReadonly();
  readonly loadError = this.error.asReadonly();

  readonly seasonIds = computed(() => {
    const map = this.data();
    if (!map) return [];
    return Object.keys(map).sort((a, b) => Number(b) - Number(a));
  });

  readonly isLoaded = computed(() => this.status() === 'loaded');

  load(): void {
    if (this.status() !== 'idle') return;
    this.status.set('loading');
    this.error.set(null);

    this.http
      .get<DraftRostersData>(DRAFT_ROSTERS_ASSET)
      .pipe(
        tap((payload) => {
          this.data.set(payload);
          this.status.set('loaded');
        }),
        catchError((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Failed to load draft rosters data';
          this.logger.error('DraftRostersDataService: failed to load', err);
          this.error.set(message);
          this.status.set('error');
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
