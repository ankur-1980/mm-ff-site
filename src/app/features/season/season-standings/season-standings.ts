import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import type { HonorBannerData } from '../../../models/honor-banner.model';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { DataTableComponent } from '../../../shared/table';
import { HonorBannerComponent } from '../../../shared/components/honor-banner/honor-banner.component';
import { SeasonBannerService } from './season-banner.service';
import { SeasonStandingsService } from './season-standings.service';

@Component({
  selector: 'app-season-standings',
  imports: [DataTableComponent, HonorBannerComponent],
  templateUrl: './season-standings.html',
  styleUrl: './season-standings.scss',
})
export class SeasonStandings {
  private readonly route = inject(ActivatedRoute);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly seasonStandings = inject(SeasonStandingsService);
  private readonly seasonBanner = inject(SeasonBannerService);

  private readonly year = toSignal(
    (this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null))
    ),
    { initialValue: null }
  );

  private readonly standings = computed(() => {
    const y = this.year();
    if (y == null) return null;
    return this.seasonStandingsData.getStandingsForSeason(String(y));
  });

  protected readonly tableState = computed(() =>
    this.seasonStandings.toTableState(this.standings())
  );

  protected readonly championHonorData = computed<HonorBannerData | null>(() => {
    const y = this.year();
    if (y == null) return null;

    const seasonId = String(y);
    const banner = this.seasonBanner.getChampionData(seasonId);
    const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
    if (!banner || !standings) return null;

    const championEntry = Object.values(standings).find(
      (entry) => entry.playerDetails?.managerName === banner.ownerName,
    );
    if (!championEntry) return null;

    const record = championEntry.record;

    return {
      type: 'premier',
      ownerName: banner.ownerName,
      teamName: banner.teamName,
      year: y,
      record: `${record.win}-${record.loss}-${record.tie}`,
      matchup:
        banner.score != null && banner.runnerUpScore != null && banner.runnerUpTeamName
          ? {
              team1: {
                ownerName: banner.ownerName,
                totalPoints: banner.score,
                result: 'winner',
              },
              team2: {
                teamName: banner.runnerUpTeamName,
                ownerName: banner.runnerUpOwnerName,
                totalPoints: banner.runnerUpScore,
                result: 'loser',
              },
            }
          : undefined,
    };
  });

  protected readonly toiletBowlHonorData = computed<HonorBannerData | null>(() => {
    const y = this.year();
    if (y == null) return null;

    const seasonId = String(y);
    const banner = this.seasonBanner.getToiletBowlData(seasonId);
    const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
    if (!banner || !standings) return null;

    const winnerEntry = Object.values(standings).find(
      (entry) => entry.playerDetails?.managerName === banner.ownerName,
    );
    if (!winnerEntry) return null;

    const record = winnerEntry.record;

    return {
      type: 'consolation',
      ownerName: banner.ownerName,
      teamName: banner.teamName,
      year: y,
      record: `${record.win}-${record.loss}-${record.tie}`,
      matchup:
        banner.score != null && banner.runnerUpScore != null && banner.runnerUpTeamName
          ? {
              team1: {
                ownerName: banner.ownerName,
                totalPoints: banner.score,
                result: 'winner',
              },
              team2: {
                teamName: banner.runnerUpTeamName,
                ownerName: banner.runnerUpOwnerName,
                totalPoints: banner.runnerUpScore,
                result: 'loser',
              },
            }
          : undefined,
    };
  });

  protected readonly highScoreHonorData = computed<HonorBannerData | null>(() => {
    const y = this.year();
    if (y == null) return null;

    const rows = this.tableState().data;
    if (!rows.length) return null;

    const top = rows.reduce((best, row) =>
      row.pointsFor > best.pointsFor ? row : best
    );

    return {
      type: 'runnerUp',
      ownerName: top.managerName,
      teamName: top.teamName,
      year: y,
      record: top.pointsFor.toFixed(2),
    };
  });
}
