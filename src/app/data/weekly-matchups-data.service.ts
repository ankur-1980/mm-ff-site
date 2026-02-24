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

const WEEKLY_MATCHUPS_ASSET = 'assets/data/weekly_matchups-data.json';

export type WeeklyMatchupsDataStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Loads weekly matchups (every matchup every week every year) from assets once
 * and exposes them as signal state. Single responsibility: weekly matchups only.
 *
 * Data shape: season id -> week key ("week1".."week17") -> team key ("teamId-X") -> entry.
 */
@Injectable({ providedIn: 'root' })
export class WeeklyMatchupsDataService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  private readonly status = signal<WeeklyMatchupsDataStatus>('idle');
  private readonly data = signal<WeeklyMatchupsData | null>(null);
  private readonly error = signal<string | null>(null);

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

  /**
   * Load weekly matchups from assets. Safe to call multiple times; only the first call fetches.
   * Uses full dataset (weekly_matchups-data.json). For a smaller dev payload, point asset to MOCK_Week_Matchups.json and adapt shape if needed.
   */
  load(): void {
    if (this.status() !== 'idle') return;
    this.status.set('loading');
    this.error.set(null);

    this.http
      .get<WeeklyMatchupsData>(WEEKLY_MATCHUPS_ASSET)
      .pipe(
        tap((payload) => {
          this.data.set(payload);
          this.status.set('loaded');
        }),
        catchError((err: unknown) => {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to load weekly matchups data';
          this.error.set(message);
          this.status.set('error');
          return of(null);
        })
      )
      .subscribe();
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
