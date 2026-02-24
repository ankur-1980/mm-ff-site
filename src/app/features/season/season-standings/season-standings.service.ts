import { Injectable } from '@angular/core';

import type {
  SeasonStandings,
  SeasonStandingsEntry,
} from '../../../models/season-standings.model';
import type { DataTableColumnDef, DataTableRow } from '../../../shared/table';

export interface SeasonStandingsRow extends DataTableRow {
  playoffRank: string | null;
  teamName: string;
  managerName: string;
  win: number;
  loss: number;
  tie: number;
  gp: number;
  winPct: number;
  pointsFor: number;
  avgPointsFor: number;
  pointsAgainst: number;
  avgPointsAgainst: number;
  diff: number;
  moves: number;
  trades: number;
}

export interface SeasonStandingsTableState {
  columns: DataTableColumnDef[];
  data: SeasonStandingsRow[];
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

@Injectable({ providedIn: 'root' })
export class SeasonStandingsService {
  readonly columns: DataTableColumnDef[] = [
    {
      key: 'playoffRank',
      header: 'Playoff Rank',
      widthCh: 12,
      align: 'center',
      format: 'integer',
      defaultSort: true,
    },
    { key: 'teamName', header: 'Team', widthCh: 24, subscriptKey: 'managerName' },
    { key: 'win', header: 'W', widthCh: 6, format: 'integer' },
    { key: 'loss', header: 'L', widthCh: 6, format: 'integer' },
    { key: 'tie', header: 'T', widthCh: 6, format: 'integer' },
    { key: 'gp', header: 'GP', widthCh: 6, format: 'integer' },
    { key: 'winPct', header: 'Win %', widthCh: 8, format: 'percent2' },
    { key: 'pointsFor', header: 'PF', widthCh: 12, format: 'decimal2' },
    { key: 'avgPointsFor', header: 'Avg PF', widthCh: 10, format: 'decimal2' },
    { key: 'pointsAgainst', header: 'PA', widthCh: 12, format: 'decimal2' },
    { key: 'avgPointsAgainst', header: 'Avg PA', widthCh: 10, format: 'decimal2' },
    { key: 'diff', header: 'Diff', widthCh: 12, format: 'decimal2' },
    { key: 'moves', header: 'Moves', widthCh: 7, format: 'integer' },
    { key: 'trades', header: 'Trades', widthCh: 7, format: 'integer' },
  ];

  toTableState(standings: SeasonStandings | null): SeasonStandingsTableState {
    if (!standings) return { columns: this.columns, data: [] };

    const rows = Object.values(standings)
      .map((entry): SeasonStandingsRow => {
        const win = entry.record?.win ?? 0;
        const loss = entry.record?.loss ?? 0;
        const tie = entry.record?.tie ?? 0;
        const gp = win + loss + tie;
        const pointsFor = entry.points?.pointsFor ?? 0;
        const pointsAgainst = entry.points?.pointsAgainst ?? 0;
        const rawPlayoffRank = entry.ranks?.playoffRank;

        return {
          playoffRank:
            rawPlayoffRank != null && String(rawPlayoffRank).trim() !== ''
              ? String(rawPlayoffRank).trim()
              : null,
          teamName: teamName(entry),
          managerName: entry.playerDetails?.managerName ?? '',
          win,
          loss,
          tie,
          gp,
          winPct: gp > 0 ? (win / gp) * 100 : 0,
          pointsFor,
          avgPointsFor: gp > 0 ? pointsFor / gp : 0,
          pointsAgainst,
          avgPointsAgainst: gp > 0 ? pointsAgainst / gp : 0,
          diff: pointsFor - pointsAgainst,
          moves: entry.transactions?.moves ?? 0,
          trades: entry.transactions?.trades ?? 0,
        };
      })
      .sort((a, b) => {
        const rankA = parseRank(a.playoffRank ?? undefined);
        const rankB = parseRank(b.playoffRank ?? undefined);
        if (rankA != null && rankB != null) return rankA - rankB;
        if (rankA != null) return -1;
        if (rankB != null) return 1;
        if (b.win !== a.win) return b.win - a.win;
        return b.pointsFor - a.pointsFor;
      });

    return { columns: this.columns, data: rows };
  }
}

