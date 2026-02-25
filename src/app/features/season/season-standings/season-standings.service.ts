import { inject, Injectable } from '@angular/core';

import type {
  SeasonStandings,
  SeasonStandingsEntry,
} from '../../../models/season-standings.model';
import type { DataTableColumnDef, DataTableRow } from '../../../shared/table';
import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import { PythagoreanRankingsService } from '../season-power-rankings/pythagorean-rankings.service';
import { LoggerService } from '@ankur-1980/logger';

export interface SeasonStandingsRow extends DataTableRow {
  playoffRank: string | null;
  regularSeasonRank: number | null;
  luckRank: number;
  teamName: string;
  managerName: string;
  win: number;
  loss: number;
  tie: number;
  gp: number;
  winPct: number;
  pythagoreanExpectedWins: number;
  luckScore: number;
  pointsFor: number;
  avgPointsFor: number;
  pointsAgainst: number;
  avgPointsAgainst: number;
  highPoints: number;
  lowPoints: number | null;
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

function normalizeTeamName(value: string | null | undefined): string {
  return value != null ? String(value).trim().toLowerCase() : '';
}

function incrementCount(map: Map<string, number>, key: string): void {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + 1);
}

function buildRegularSeasonRanks(
  rows: SeasonStandingsRow[]
): Map<SeasonStandingsRow, number> {
  const sorted = [...rows].sort((a, b) => {
    if (b.win !== a.win) return b.win - a.win;
    return b.pointsFor - a.pointsFor;
  });
  const ranks = new Map<SeasonStandingsRow, number>();

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
    ranks.set(row, currentRank);
  });

  return ranks;
}

function buildLuckRanks(rows: SeasonStandingsRow[]): Map<SeasonStandingsRow, number> {
  const sorted = [...rows].sort((a, b) => b.luckScore - a.luckScore);
  const ranks = new Map<SeasonStandingsRow, number>();

  let currentRank = 0;
  let lastLuckScore: number | null = null;

  sorted.forEach((row, index) => {
    if (lastLuckScore == null || row.luckScore !== lastLuckScore) {
      currentRank = index + 1;
      lastLuckScore = row.luckScore;
    }
    ranks.set(row, currentRank);
  });

  return ranks;
}

@Injectable({ providedIn: 'root' })
export class SeasonStandingsService {
  private readonly pythagoreanRankings = inject(PythagoreanRankingsService);
  private readonly weeklyMatchupsData = inject(WeeklyMatchupsDataService);
  private readonly leagueMetaData = inject(LeagueMetaDataService);
  private readonly logger = inject(LoggerService);
  private readonly loggedWinConflicts = new Set<string>();

  readonly columns: DataTableColumnDef[] = [
    {
      key: 'playoffRank',
      header: 'Playoff Rank',
      widthCh: 12,
      align: 'center',
      format: 'integer',
      defaultSort: true,
    },
    {
      key: 'regularSeasonRank',
      header: 'Regular Season',
      widthCh: 14,
      align: 'center',
      format: 'integer',
    },
    { key: 'teamName', header: 'Team', widthCh: 24, subscriptKey: 'managerName' },
    { key: 'win', header: 'W', widthCh: 6, format: 'integer' },
    { key: 'loss', header: 'L', widthCh: 6, format: 'integer' },
    { key: 'tie', header: 'T', widthCh: 6, format: 'integer' },
    { key: 'gp', header: 'GP', widthCh: 6, format: 'integer' },
    { key: 'winPct', header: 'Win %', widthCh: 8, format: 'percent2' },
    { key: 'pythagoreanExpectedWins', header: 'Pythag W', widthCh: 10, format: 'decimal2' },
    { key: 'luckScore', header: 'Luck', widthCh: 8, format: 'signedDecimal2' },
    { key: 'pointsFor', header: 'PF', widthCh: 12, format: 'decimal2' },
    { key: 'avgPointsFor', header: 'Avg PF', widthCh: 10, format: 'decimal2' },
    { key: 'pointsAgainst', header: 'PA', widthCh: 12, format: 'decimal2' },
    { key: 'avgPointsAgainst', header: 'Avg PA', widthCh: 10, format: 'decimal2' },
    { key: 'highPoints', header: 'High Pts', widthCh: 9, format: 'smartDecimal2' },
    { key: 'lowPoints', header: 'Low Pts', widthCh: 9, format: 'smartDecimal2' },
    { key: 'diff', header: 'Diff', widthCh: 12, format: 'decimal2' },
    { key: 'moves', header: 'Moves', widthCh: 7, format: 'integer' },
    { key: 'trades', header: 'Trades', widthCh: 7, format: 'integer' },
  ];

  private getColumns(hasWeeklyHistory: boolean): DataTableColumnDef[] {
    if (hasWeeklyHistory) return this.columns;
    return this.columns.filter(
      (column) =>
        column.key !== 'lowPoints' &&
        column.key !== 'moves' &&
        column.key !== 'trades'
    );
  }

  private getSeasonId(standings: SeasonStandings): string | null {
    const firstEntry = Object.values(standings)[0];
    if (!firstEntry?.season) return null;
    return String(firstEntry.season);
  }

  private getWeeklyPointFinishCounts(seasonId: string): Map<string, { high: number; low: number }> {
    const counts = new Map<string, { high: number; low: number }>();
    const seasonMeta = this.leagueMetaData.getSeasonMeta(seasonId);
    if (!seasonMeta) return counts;

    for (let week = 1; week <= seasonMeta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(seasonId, `week${week}`);
      if (!weekData) continue;

      const entries = Object.values(weekData);
      if (!entries.length) continue;

      const scores = entries.map((entry) => entry.team1Totals?.totalPoints ?? 0);
      const topScore = Math.max(...scores);
      const lowScore = Math.min(...scores);

      const topTeams = entries.filter(
        (entry) => Math.abs((entry.team1Totals?.totalPoints ?? 0) - topScore) < 0.000001
      );
      const lowTeams = entries.filter(
        (entry) => Math.abs((entry.team1Totals?.totalPoints ?? 0) - lowScore) < 0.000001
      );

      for (const entry of topTeams) {
        const team = entry.matchup?.team1Name;
        if (!team) continue;
        const existing = counts.get(team) ?? { high: 0, low: 0 };
        counts.set(team, { ...existing, high: existing.high + 1 });
      }

      for (const entry of lowTeams) {
        const team = entry.matchup?.team1Name;
        if (!team) continue;
        const existing = counts.get(team) ?? { high: 0, low: 0 };
        counts.set(team, { ...existing, low: existing.low + 1 });
      }
    }

    return counts;
  }

  private getRegularSeasonWinsByTeam(
    seasonId: string
  ): { winsByTeam: Map<string, number>; hasRegularSeasonHistory: boolean } {
    const winsByTeam = new Map<string, number>();
    const seasonMeta = this.leagueMetaData.getSeasonMeta(seasonId);
    if (!seasonMeta) return { winsByTeam, hasRegularSeasonHistory: false };

    let matchupCount = 0;

    for (let week = 1; week <= seasonMeta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(seasonId, `week${week}`);
      if (!weekData) continue;

      const seenMatchups = new Set<string>();

      for (const entry of Object.values(weekData)) {
        const matchup = entry.matchup;
        if (!matchup?.team1Name || !matchup?.team2Name) continue;

        const matchupKey = [matchup.team1Id, matchup.team2Id].sort().join('|');
        if (seenMatchups.has(matchupKey)) continue;
        seenMatchups.add(matchupKey);

        const team1Score = Number(matchup.team1Score);
        const team2Score = Number(matchup.team2Score);
        if (Number.isNaN(team1Score) || Number.isNaN(team2Score)) continue;

        matchupCount += 1;

        if (team1Score > team2Score) {
          incrementCount(winsByTeam, normalizeTeamName(matchup.team1Name));
        } else if (team2Score > team1Score) {
          incrementCount(winsByTeam, normalizeTeamName(matchup.team2Name));
        }
      }
    }

    return { winsByTeam, hasRegularSeasonHistory: matchupCount > 0 };
  }

  toTableState(standings: SeasonStandings | null): SeasonStandingsTableState {
    if (!standings) return { columns: this.getColumns(false), data: [] };

    const seasonId = this.getSeasonId(standings);
    const { winsByTeam, hasRegularSeasonHistory } =
      seasonId != null
        ? this.getRegularSeasonWinsByTeam(seasonId)
        : { winsByTeam: new Map<string, number>(), hasRegularSeasonHistory: false };
    const weeklyPointFinishCounts =
      seasonId != null ? this.getWeeklyPointFinishCounts(seasonId) : new Map();
    const hasWeeklyHistory = weeklyPointFinishCounts.size > 0 || hasRegularSeasonHistory;

    const rows = Object.values(standings)
      .map((entry): SeasonStandingsRow => {
        const standingsWin = entry.record?.win ?? 0;
        const loss = entry.record?.loss ?? 0;
        const tie = entry.record?.tie ?? 0;
        const pointsFor = entry.points?.pointsFor ?? 0;
        const pointsAgainst = entry.points?.pointsAgainst ?? 0;
        const team = teamName(entry);
        const matchupWin = winsByTeam.get(normalizeTeamName(team));
        const win = hasRegularSeasonHistory && matchupWin != null ? matchupWin : standingsWin;
        if (
          seasonId != null &&
          hasRegularSeasonHistory &&
          matchupWin != null &&
          matchupWin !== standingsWin
        ) {
          const conflictKey = `${seasonId}|${normalizeTeamName(team)}|${standingsWin}|${matchupWin}`;
          if (!this.loggedWinConflicts.has(conflictKey)) {
            this.loggedWinConflicts.add(conflictKey);
            this.logger.warn(
              `SeasonStandingsService: wins conflict in season ${seasonId} for "${team}" ` +
                `(standings=${standingsWin}, matchups=${matchupWin})`
            );
          }
        }
        const gp = win + loss + tie;
        const weeklyCounts = weeklyPointFinishCounts.get(team);
        const highPoints = hasWeeklyHistory
          ? (weeklyCounts?.high ?? 0)
          : (entry.points?.highPoints ?? 0);
        const lowPoints = hasWeeklyHistory
          ? (weeklyCounts?.low ?? 0)
          : (entry.points?.lowPoints ?? null);
        const rawPlayoffRank = entry.ranks?.playoffRank;
        const rawRegularSeasonRank = entry.ranks?.regularSeasonRank;

        const pythagoreanExpectedWins = this.pythagoreanRankings.calculateExpectedWins(
          pointsFor,
          pointsAgainst,
          gp
        );

        return {
          playoffRank:
            rawPlayoffRank != null && String(rawPlayoffRank).trim() !== ''
              ? String(rawPlayoffRank).trim()
              : null,
          regularSeasonRank: parseRank(rawRegularSeasonRank),
          luckRank: 0,
          teamName: team,
          managerName: entry.playerDetails?.managerName ?? '',
          win,
          loss,
          tie,
          gp,
          winPct: gp > 0 ? (win / gp) * 100 : 0,
          pythagoreanExpectedWins,
          luckScore: win - pythagoreanExpectedWins,
          pointsFor,
          avgPointsFor: gp > 0 ? pointsFor / gp : 0,
          pointsAgainst,
          avgPointsAgainst: gp > 0 ? pointsAgainst / gp : 0,
          highPoints,
          lowPoints,
          diff: pointsFor - pointsAgainst,
          moves: entry.transactions?.moves ?? 0,
          trades: entry.transactions?.trades ?? 0,
        };
      });

    const computedRegularSeasonRanks = buildRegularSeasonRanks(rows);
    const computedLuckRanks = buildLuckRanks(rows);

    const normalizedRows = rows
      .map((row) => ({
        ...row,
        regularSeasonRank:
          row.regularSeasonRank ?? computedRegularSeasonRanks.get(row) ?? null,
        luckRank: computedLuckRanks.get(row) ?? 0,
      }))
      .sort((a, b) => {
        const rankA = parseRank(a.playoffRank ?? undefined);
        const rankB = parseRank(b.playoffRank ?? undefined);
        if (rankA != null && rankB != null) return rankA - rankB;
        if (rankA != null) return -1;
        if (rankB != null) return 1;
        if (b.win !== a.win) return b.win - a.win;
        return b.pointsFor - a.pointsFor;
      });

    return { columns: this.getColumns(hasWeeklyHistory), data: normalizedRows };
  }
}

