import type { SeasonStandings, SeasonStandingsEntry } from '../../../models/season-standings.model';

/** One row for the standings preview table. */
export interface StandingsPreviewRow {
  playoffRank: string | null;
  managerName: string;
  teamName: string;
  win: number;
  loss: number;
  tie: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  regularSeasonRank: string | null;
  moves: number;
  trades: number;
}

export interface MapStandingsResult {
  rows: StandingsPreviewRow[];
  showPlayoffRank: boolean;
  showRegularSeasonRank: boolean;
}

/**
 * Resolve team display name from the season entry (per-season team name).
 * Use "Unknown Team" only when data is genuinely missing.
 */
function teamDisplayName(entry: SeasonStandingsEntry): string {
  const name = entry.playerDetails?.teamName;
  return name != null && String(name).trim() !== '' ? String(name).trim() : 'Unknown Team';
}

function parseRank(value: string | undefined): number | null {
  if (value == null || String(value).trim() === '') return null;
  const n = Number.parseInt(String(value).trim(), 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Map season standings to preview table rows. Sorts by regular season rank when present,
 * else by wins (desc), then points for (desc). Reusable utility; keep component clean.
 */
export function mapSeasonStandingsToPreviewRows(
  standings: SeasonStandings
): MapStandingsResult {
  const entries = Object.entries(standings);
  const sorted = [...entries].sort(([, a], [, b]) => {
    const rankA = parseRank(a.ranks?.regularSeasonRank);
    const rankB = parseRank(b.ranks?.regularSeasonRank);
    if (rankA != null && rankB != null) return rankA - rankB;
    if (rankA != null) return -1;
    if (rankB != null) return 1;
    if (b.record.win !== a.record.win) return b.record.win - a.record.win;
    return (b.points?.pointsFor ?? 0) - (a.points?.pointsFor ?? 0);
  });

  const rows: StandingsPreviewRow[] = sorted.map(([, entry]) => {
    const win = entry.record?.win ?? 0;
    const loss = entry.record?.loss ?? 0;
    const tie = entry.record?.tie ?? 0;
    const total = win + loss + tie;
    const winPct = total > 0 ? (win / total) * 100 : 0;
    const pointsFor = entry.points?.pointsFor ?? 0;
    const pointsAgainst = entry.points?.pointsAgainst ?? 0;
    const playoffRankRaw = entry.ranks?.playoffRank;
    const regularSeasonRankRaw = entry.ranks?.regularSeasonRank;
    return {
      playoffRank:
        playoffRankRaw != null && String(playoffRankRaw).trim() !== ''
          ? String(playoffRankRaw).trim()
          : null,
      managerName: entry.playerDetails?.managerName ?? '',
      teamName: teamDisplayName(entry),
      win,
      loss,
      tie,
      winPct,
      pointsFor,
      pointsAgainst,
      pointsDiff: pointsFor - pointsAgainst,
      regularSeasonRank:
        regularSeasonRankRaw != null && String(regularSeasonRankRaw).trim() !== ''
          ? String(regularSeasonRankRaw).trim()
          : null,
      moves: entry.transactions?.moves ?? 0,
      trades: entry.transactions?.trades ?? 0
    };
  });

  const showPlayoffRank = rows.some((r) => r.playoffRank != null);
  const showRegularSeasonRank = rows.some((r) => r.regularSeasonRank != null);

  return { rows, showPlayoffRank, showRegularSeasonRank };
}
