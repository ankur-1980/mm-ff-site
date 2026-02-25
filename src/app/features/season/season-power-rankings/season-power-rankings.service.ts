import { Injectable } from '@angular/core';

import type {
  SeasonStandings,
  SeasonStandingsEntry,
} from '../../../models/season-standings.model';
import type { DataTableColumnDef, DataTableRow } from '../../../shared/table';

export interface SeasonPowerRankingRow extends DataTableRow {
  ownerId: string;
  teamName: string;
  managerName: string;
  win: number;
  playoffRank: number | null;
  regularSeasonRank: number | null;
  pointsFor: number;
  pointsForRank: number;
  total: number | null;
}

export interface SeasonPowerRankingsTableState {
  columns: DataTableColumnDef[];
  data: SeasonPowerRankingRow[];
}

function parseRank(value: string | undefined): number | null {
  if (value == null || String(value).trim() === '') return null;
  const parsed = Number.parseInt(String(value).trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function teamName(entry: SeasonStandingsEntry): string {
  const value = entry.playerDetails?.teamName;
  return value != null && String(value).trim() !== ''
    ? String(value).trim()
    : 'Unknown Team';
}

function buildPointsForRanks(
  rows: Pick<SeasonPowerRankingRow, 'ownerId' | 'pointsFor'>[]
): Map<string, number> {
  const sorted = [...rows].sort((a, b) => b.pointsFor - a.pointsFor);
  const ranks = new Map<string, number>();

  let currentRank = 0;
  let lastPointsFor: number | null = null;

  sorted.forEach((row, index) => {
    if (lastPointsFor == null || row.pointsFor !== lastPointsFor) {
      currentRank = index + 1;
      lastPointsFor = row.pointsFor;
    }
    ranks.set(row.ownerId, currentRank);
  });

  return ranks;
}

function buildRegularSeasonRanks(
  rows: Pick<SeasonPowerRankingRow, 'ownerId' | 'win' | 'pointsFor'>[]
): Map<string, number> {
  const sorted = [...rows].sort((a, b) => {
    if (b.win !== a.win) return b.win - a.win;
    return b.pointsFor - a.pointsFor;
  });
  const ranks = new Map<string, number>();

  let currentRank = 0;
  let lastWins: number | null = null;
  let lastPointsFor: number | null = null;

  sorted.forEach((row, index) => {
    if (
      lastWins == null ||
      lastPointsFor == null ||
      row.win !== lastWins ||
      row.pointsFor !== lastPointsFor
    ) {
      currentRank = index + 1;
      lastWins = row.win;
      lastPointsFor = row.pointsFor;
    }
    ranks.set(row.ownerId, currentRank);
  });

  return ranks;
}

function compareNullableNumbersAsc(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

@Injectable({ providedIn: 'root' })
export class SeasonPowerRankingsService {
  readonly columns: DataTableColumnDef[] = [
    { key: 'teamName', header: 'Team', widthCh: 26, subscriptKey: 'managerName' },
    { key: 'playoffRank', header: 'Playoff', widthCh: 8, align: 'center', format: 'integer' },
    {
      key: 'regularSeasonRank',
      header: 'Regular Season',
      widthCh: 14,
      align: 'center',
      format: 'integer',
    },
    {
      key: 'pointsForRank',
      header: 'Points For',
      widthCh: 11,
      align: 'center',
      format: 'integer',
    },
    {
      key: 'total',
      header: 'Total',
      widthCh: 8,
      align: 'center',
      format: 'integer',
      defaultSort: true,
    },
  ];

  toTableState(standings: SeasonStandings | null): SeasonPowerRankingsTableState {
    if (!standings) return { columns: this.columns, data: [] };

    const baseRows: SeasonPowerRankingRow[] = Object.entries(standings).map(
      ([ownerId, entry]) => ({
        ownerId,
        teamName: teamName(entry),
        managerName: entry.playerDetails?.managerName ?? '',
        win: entry.record?.win ?? 0,
        playoffRank: parseRank(entry.ranks?.playoffRank),
        regularSeasonRank: parseRank(entry.ranks?.regularSeasonRank),
        pointsFor: entry.points?.pointsFor ?? 0,
        pointsForRank: 0,
        total: null,
      })
    );

    const pointsForRanks = buildPointsForRanks(baseRows);
    const regularSeasonRanks = buildRegularSeasonRanks(baseRows);

    const rows = baseRows
      .map((row) => {
        const pointsForRank = pointsForRanks.get(row.ownerId) ?? 0;
        const regularSeasonRank =
          row.regularSeasonRank ?? regularSeasonRanks.get(row.ownerId) ?? null;
        const total =
          row.playoffRank != null && regularSeasonRank != null
            ? row.playoffRank + regularSeasonRank + pointsForRank
            : null;

        return {
          ...row,
          regularSeasonRank,
          pointsForRank,
          total,
        };
      })
      .sort((a, b) => {
        const totalCompare = compareNullableNumbersAsc(a.total, b.total);
        if (totalCompare !== 0) return totalCompare;

        const playoffCompare = compareNullableNumbersAsc(a.playoffRank, b.playoffRank);
        if (playoffCompare !== 0) return playoffCompare;

        const regCompare = compareNullableNumbersAsc(
          a.regularSeasonRank,
          b.regularSeasonRank
        );
        if (regCompare !== 0) return regCompare;

        if (a.pointsForRank !== b.pointsForRank) return a.pointsForRank - b.pointsForRank;
        return a.teamName.localeCompare(b.teamName);
      });

    return { columns: this.columns, data: rows };
  }
}
