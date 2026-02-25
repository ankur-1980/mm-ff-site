import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { LoggerService } from '@ankur-1980/logger';

export interface ToiletBowlEntry {
  champion: string;
}

export type ToiletBowlData = Record<string, ToiletBowlEntry>;

const TOILET_BOWL_ASSET = 'assets/data/toilet-bowl-data.json';

@Injectable({ providedIn: 'root' })
export class ToiletBowlDataService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  private readonly data = signal<ToiletBowlData | null>(null);
  private readonly status = signal<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  readonly isLoaded = () => this.status() === 'loaded';

  load(): void {
    if (this.status() !== 'idle') return;
    this.status.set('loading');

    this.http
      .get<ToiletBowlData>(TOILET_BOWL_ASSET)
      .pipe(
        tap((payload) => {
          this.data.set(payload);
          this.status.set('loaded');
        }),
        catchError((err: unknown) => {
          this.logger.error('ToiletBowlDataService: failed to load', err);
          this.status.set('error');
          return of(null);
        })
      )
      .subscribe();
  }

  getEntry(seasonId: string): ToiletBowlEntry | null {
    return this.data()?.[seasonId] ?? null;
  }
}
