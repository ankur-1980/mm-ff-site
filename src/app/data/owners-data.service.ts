import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import type { Owner, OwnersData } from '../models/owner.model';
import { LoggerService } from '@ankur-1980/logger';

const OWNERS_ASSET = 'assets/data/owners-data.json';

export type OwnersDataStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Loads owners metadata from assets once and exposes it as signal state.
 * Single responsibility: owners data only. No backend; in-memory after load.
 */
@Injectable({ providedIn: 'root' })
export class OwnersDataService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  private readonly status = signal<OwnersDataStatus>('idle');
  private readonly data = signal<OwnersData | null>(null);
  private readonly error = signal<string | null>(null);

  /** Current load status. */
  readonly loadStatus = this.status.asReadonly();
  /** Raw owners map (managerName -> Owner). null until loaded. */
  readonly ownersData = this.data.asReadonly();
  /** Error message when status is 'error'. */
  readonly loadError = this.error.asReadonly();

  /** All owners as an array, in stable order (by managerName). Empty until loaded. */
  readonly allOwners = computed(() => {
    const map = this.data();
    if (!map) return [];
    return Object.keys(map)
      .sort()
      .map((id) => map[id]!);
  });

  /** Whether data has been loaded successfully. */
  readonly isLoaded = computed(() => this.status() === 'loaded');

  /** Whether a load is in progress or has failed (for UI). */
  readonly hasSettled = computed(
    () => this.status() === 'loaded' || this.status() === 'error'
  );

  /**
   * Load owners from assets. Safe to call multiple times; only the first call fetches.
   * Call once from app init or from a component that needs owners.
   */
  load(): void {
    if (this.status() !== 'idle') return;
    this.status.set('loading');
    this.error.set(null);

    this.http
      .get<OwnersData>(OWNERS_ASSET)
      .pipe(
        tap((payload) => {
          this.data.set(payload);
          this.status.set('loaded');
        }),
        catchError((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Failed to load owners data';
          this.error.set(message);
          this.status.set('error');
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Get one owner by stable id (managerName). Returns null if not loaded or not found.
   */
  getOwner(ownerId: string): Owner | null {
    const map = this.data();
    return map?.[ownerId] ?? null;
  }

  /**
   * Check if an owner id exists in the loaded data.
   */
  hasOwner(ownerId: string): boolean {
    const map = this.data();
    return map != null && ownerId in map;
  }
}
