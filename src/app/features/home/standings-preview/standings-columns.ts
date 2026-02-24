import type { DataTableColumnDef } from '../../../shared/table/table.models';

/**
 * Build column definitions for the standings table. Optional columns
 * (playoff rank, regular season rank) are included only when the data has them.
 */
export function buildStandingsColumns(
  showPlayoffRank: boolean,
  showRegularSeasonRank: boolean
): DataTableColumnDef[] {
  const cols: DataTableColumnDef[] = [];

  if (showPlayoffRank) {
    cols.push({
      key: 'playoffRank',
      header: 'Playoff Rank',
      widthCh: 6,
      align: 'center',
      format: 'integer',
    });
  }

  cols.push({
    key: 'teamName',
    header: 'Team',
    widthCh: 25,
    subscriptKey: 'managerName',
  });

  cols.push(
    { key: 'win', header: 'W', widthCh: 6, format: 'integer' },
    { key: 'loss', header: 'L', widthCh: 6, format: 'integer' },
    { key: 'tie', header: 'T', widthCh: 6, format: 'integer' },
    { key: 'winPct', header: 'Win %', widthCh: 8, format: 'percent2' },
    { key: 'pointsFor', header: 'PF', widthCh: 12, format: 'decimal2' },
    { key: 'pointsAgainst', header: 'PA', widthCh: 12, format: 'decimal2' },
    { key: 'pointsDiff', header: 'Diff', widthCh: 12, format: 'decimal2' },
    { key: 'moves', header: 'Moves', widthCh: 6, format: 'integer' },
    { key: 'trades', header: 'Trades', widthCh: 6, format: 'integer' }
  );

  if (showRegularSeasonRank) {
    cols.push({
      key: 'regularSeasonRank',
      header: 'Reg. Rank',
      widthCh: 6,
      align: 'center',
      format: 'integer',
      defaultSort: true,
    });
  } else {
    const winIdx = cols.findIndex((c) => c.key === 'win');
    if (winIdx >= 0) cols[winIdx] = { ...cols[winIdx], defaultSort: true };
  }

  return cols;
}
