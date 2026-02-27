import { inject, Injectable } from '@angular/core';

import type { PfPaScatterPoint, PfPaScatterResult } from '../models/pf-pa-scatter.models';
import { PythagoreanRankingsService } from '../../season-power-rankings/pythagorean-rankings.service';
import { SeasonStandingsDataService } from '../../../../data/season-standings-data.service';
import { SeasonStandingsService } from '../../season-standings/season-standings.service';
import { mapTeamNameShort } from '../../../../shared/mappers/team-name-short.mapper';

@Injectable({ providedIn: 'root' })
export class PfPaScatterService {
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly seasonStandings = inject(SeasonStandingsService);
  private readonly pythagorean = inject(PythagoreanRankingsService);

  buildScatterData(seasonId: string): PfPaScatterResult | null {
    const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
    if (!standings) return null;
    const state = this.seasonStandings.toTableState(standings);
    const rows = state.data;
    if (!rows.length) return null;

    let sumPF = 0;
    let sumPA = 0;
    const points: PfPaScatterPoint[] = rows.map((row) => {
      const pf = row.pointsFor;
      const pa = row.pointsAgainst;
      const gp = row.gp ?? 0;
      const expectedWins = gp > 0 ? this.pythagorean.calculateExpectedWins(pf, pa, gp) : 0;
      const actualWins = row.win ?? 0;
      const luck = actualWins - expectedWins;
      sumPF += pf;
      sumPA += pa;
      const abbrev = mapTeamNameShort(row.teamName);
      return {
        x: pf,
        y: pa,
        teamName: row.teamName,
        abbrev,
        pointsFor: pf,
        pointsAgainst: pa,
        expectedWins,
        actualWins,
        luck,
      };
    });

    const n = points.length;
    const avgPF = sumPF / n;
    const avgPA = sumPA / n;

    const allValues = points.flatMap((p) => [p.x, p.y]);
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const pad = (dataMax - dataMin) * 0.08 || 10;
    const axisMin = Math.floor((dataMin - pad) / 5) * 5;
    const axisMax = Math.ceil((dataMax + pad) / 5) * 5;

    return {
      points,
      avgPF,
      avgPA,
      axisMin,
      axisMax,
    };
  }
}
