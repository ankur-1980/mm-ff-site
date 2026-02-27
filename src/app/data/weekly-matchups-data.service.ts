import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import type {
  WeeklyMatchupsData,
  WeeklyMatchupEntry,
  WeekMatchups,
  SeasonWeekMatchups
} from '../models/weekly-matchups.model';
import { LoggerService } from '@ankur-1980/logger';

const WEEKLY_MATCHUPS_ASSET_DIR = 'assets/data/weekly-matchups';

export type WeeklyMatchupsDataStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Loads weekly matchups from per-season assets and merges them into one in-memory map.
 * Single responsibility: weekly matchups only.
 */
@Injectable({ providedIn: 'root' })
export class WeeklyMatchupsDataService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  private readonly status = signal<WeeklyMatchupsDataStatus>('idle');
  private readonly data = signal<WeeklyMatchupsData | null>(null);
  private readonly error = signal<string | null>(null);
  private readonly loadedSeasons = new Set<string>();
  private readonly loadingSeasons = new Set<string>();

  /** Current load status. */
  readonly loadStatus = this.status.asReadonly();
  /** Raw matchups: season id -> week key -> team key -> entry. null until loaded. */
  readonly weeklyMatchupsData = this.data.asReadonly();
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

  /** Load one season's weekly matchups from `assets/data/weekly-matchups/<year>.json`. */
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
      .get<WeeklyMatchupsData>(
        `${WEEKLY_MATCHUPS_ASSET_DIR}/${normalizedSeasonId}.json`
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
              : `Failed to load weekly matchups data for ${normalizedSeasonId}`;
          this.logger.error('WeeklyMatchupsDataService: failed to load', err);
          this.error.set(message);
          this.loadingSeasons.delete(normalizedSeasonId);
          this.status.set(this.loadedSeasons.size > 0 ? 'loaded' : 'error');
          return of(null);
        })
      )
      .subscribe();
  }

  /** Load multiple seasons. Each season file is fetched at most once. */
  loadSeasons(seasonIds: readonly string[]): void {
    for (const seasonId of seasonIds) {
      this.loadSeason(seasonId);
    }
  }

  /**
   * Get all weeks for one season. Returns null if not loaded or season not found.
   * Keys are "week1", "week2", ... "week17".
   */
  getSeasonWeeks(seasonId: string): SeasonWeekMatchups | null {
    const map = this.data();
    return map?.[seasonId] ?? null;
  }

  /**
   * Get all team matchup entries for one week. Returns null if not loaded or week not found.
   * weekKey should be "week1" | "week2" | ... | "week17".
   */
  getMatchupsForWeek(seasonId: string, weekKey: string): WeekMatchups | null {
    const season = this.getSeasonWeeks(seasonId);
    return season?.[weekKey] ?? null;
  }

  /**
   * Get one team's matchup entry for a specific season and week.
   * teamKey is the key in the data (e.g. "teamId-1"). Returns null if not loaded or not found.
   */
  getEntry(
    seasonId: string,
    weekKey: string,
    teamKey: string
  ): WeeklyMatchupEntry | null {
    const week = this.getMatchupsForWeek(seasonId, weekKey);
    return week?.[teamKey] ?? null;
  }

  /**
   * Get week keys for a season (e.g. ["week1", "week2", ...]). Sorted by week number.
   */
  getWeekKeysForSeason(seasonId: string): string[] {
    const season = this.getSeasonWeeks(seasonId);
    if (!season) return [];
    return Object.keys(season).sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ''), 10);
      const nb = parseInt(b.replace(/\D/g, ''), 10);
      return na - nb;
    });
  }

  /**
   * Check if we have matchups for the given season.
   */
  hasSeason(seasonId: string): boolean {
    const map = this.data();
    return map != null && seasonId in map;
  }

  /**
   * Check if we have matchups for the given season and week.
   */
  hasWeek(seasonId: string, weekKey: string): boolean {
    const season = this.getSeasonWeeks(seasonId);
    return season != null && weekKey in season;
  }
}
