import { inject, Injectable } from '@angular/core';

import type {
  SeasonStandings,
  SeasonStandingsEntry,
} from '../../../models/season-standings.model';
import type { DataTableColumnDef } from '../../../shared/table';
import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import { LoggerService } from '@ankur-1980/logger';
import type {
  ResolvedTeamStats,
  SeasonStandingsRow,
  SeasonStandingsTableState,
  TeamRecordByTeam,
} from './season-standings.models';

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

function addPoints(map: Map<string, number>, key: string, value: number): void {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + value);
}

const EPSILON = 0.000001;

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

@Injectable({ providedIn: 'root' })
export class SeasonStandingsService {
  private readonly weeklyMatchupsData = inject(WeeklyMatchupsDataService);
  private readonly leagueMetaData = inject(LeagueMetaDataService);
  private readonly logger = inject(LoggerService);
  private readonly loggedRecordConflicts = new Set<string>();

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
    { key: 'pointsFor', header: 'PF', widthCh: 12, format: 'decimal2' },
    { key: 'pointsAgainst', header: 'PA', widthCh: 12, format: 'decimal2' },
    { key: 'diff', header: 'Diff', widthCh: 12, format: 'decimal2' },
    { key: 'highPoints', header: 'High Pts', widthCh: 9, format: 'smartDecimal2' },
    { key: 'lowPoints', header: 'Low Pts', widthCh: 9, format: 'smartDecimal2' },
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

  private getRegularSeasonRecordByTeam(seasonId: string): TeamRecordByTeam {
    const winsByTeam = new Map<string, number>();
    const lossesByTeam = new Map<string, number>();
    const tiesByTeam = new Map<string, number>();
    const pointsForByTeam = new Map<string, number>();
    const pointsAgainstByTeam = new Map<string, number>();
    const highPointFinishesByTeam = new Map<string, number>();
    const lowPointFinishesByTeam = new Map<string, number>();
    const seasonMeta = this.leagueMetaData.getSeasonMeta(seasonId);
    if (!seasonMeta) {
      return {
        winsByTeam,
        lossesByTeam,
        tiesByTeam,
        pointsForByTeam,
        pointsAgainstByTeam,
        highPointFinishesByTeam,
        lowPointFinishesByTeam,
        hasRegularSeasonHistory: false,
      };
    }

    let matchupCount = 0;

    for (let week = 1; week <= seasonMeta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(seasonId, `week${week}`);
      if (!weekData) continue;

      const seenMatchups = new Set<string>();
      const entries = Object.values(weekData);
      const weeklyEntriesWithTeam = entries.filter((entry) => !!entry.matchup?.team1Name);

      if (weeklyEntriesWithTeam.length > 0) {
        const scores = weeklyEntriesWithTeam.map((entry) => entry.team1Totals?.totalPoints ?? 0);
        const topScore = Math.max(...scores);
        const lowScore = Math.min(...scores);

        for (const entry of weeklyEntriesWithTeam) {
          const normalizedTeam = normalizeTeamName(entry.matchup?.team1Name);
          const totalPoints = entry.team1Totals?.totalPoints ?? 0;

          if (Math.abs(totalPoints - topScore) < EPSILON) {
            incrementCount(highPointFinishesByTeam, normalizedTeam);
          }
          if (Math.abs(totalPoints - lowScore) < EPSILON) {
            incrementCount(lowPointFinishesByTeam, normalizedTeam);
          }
        }
      }

      for (const entry of entries) {
        const matchup = entry.matchup;
        if (!matchup?.team1Name || !matchup?.team2Name) continue;

        const matchupKey = [matchup.team1Id, matchup.team2Id].sort().join('|');
        if (seenMatchups.has(matchupKey)) continue;
        seenMatchups.add(matchupKey);

        const team1Score = Number(matchup.team1Score);
        const team2Score = Number(matchup.team2Score);
        if (Number.isNaN(team1Score) || Number.isNaN(team2Score)) continue;

        matchupCount += 1;
        const team1Name = normalizeTeamName(matchup.team1Name);
        const team2Name = normalizeTeamName(matchup.team2Name);

        addPoints(pointsForByTeam, team1Name, team1Score);
        addPoints(pointsAgainstByTeam, team1Name, team2Score);
        addPoints(pointsForByTeam, team2Name, team2Score);
        addPoints(pointsAgainstByTeam, team2Name, team1Score);

        if (team1Score > team2Score) {
          incrementCount(winsByTeam, team1Name);
          incrementCount(lossesByTeam, team2Name);
        } else if (team2Score > team1Score) {
          incrementCount(winsByTeam, team2Name);
          incrementCount(lossesByTeam, team1Name);
        } else {
          incrementCount(tiesByTeam, team1Name);
          incrementCount(tiesByTeam, team2Name);
        }
      }
    }

    return {
      winsByTeam,
      lossesByTeam,
      tiesByTeam,
      pointsForByTeam,
      pointsAgainstByTeam,
      highPointFinishesByTeam,
      lowPointFinishesByTeam,
      hasRegularSeasonHistory: matchupCount > 0,
    };
  }

  private logRecordConflict(
    seasonId: string,
    team: string,
    field: 'wins' | 'losses' | 'ties' | 'pointsFor' | 'pointsAgainst',
    standingsValue: number,
    matchupValue: number
  ): void {
    const conflictKey = `${seasonId}|${field}|${normalizeTeamName(team)}|${standingsValue}|${matchupValue}`;
    if (this.loggedRecordConflicts.has(conflictKey)) return;
    this.loggedRecordConflicts.add(conflictKey);
    this.logger.warn(
      `SeasonStandingsService: ${field} conflict in season ${seasonId} for "${team}" ` +
        `(standings=${standingsValue}, matchups=${matchupValue})`
    );
  }

  private resolveTeamStats(
    entry: SeasonStandingsEntry,
    normalizedTeam: string,
    regularSeason: TeamRecordByTeam
  ): ResolvedTeamStats {
    const standingsWin = entry.record?.win ?? 0;
    const standingsLoss = entry.record?.loss ?? 0;
    const standingsTie = entry.record?.tie ?? 0;
    const standingsPointsFor = entry.points?.pointsFor ?? 0;
    const standingsPointsAgainst = entry.points?.pointsAgainst ?? 0;

    const matchupWin = regularSeason.winsByTeam.get(normalizedTeam) ?? null;
    const matchupLoss = regularSeason.lossesByTeam.get(normalizedTeam) ?? null;
    const matchupTie = regularSeason.tiesByTeam.get(normalizedTeam) ?? null;
    const matchupPointsFor = regularSeason.pointsForByTeam.get(normalizedTeam) ?? null;
    const matchupPointsAgainst = regularSeason.pointsAgainstByTeam.get(normalizedTeam) ?? null;
    const matchupHighPointFinishes =
      regularSeason.highPointFinishesByTeam.get(normalizedTeam) ?? null;
    const matchupLowPointFinishes = regularSeason.lowPointFinishesByTeam.get(normalizedTeam) ?? null;

    const win =
      regularSeason.hasRegularSeasonHistory && matchupWin != null ? matchupWin : standingsWin;
    const loss =
      regularSeason.hasRegularSeasonHistory && matchupLoss != null ? matchupLoss : standingsLoss;
    const tie =
      regularSeason.hasRegularSeasonHistory && matchupTie != null ? matchupTie : standingsTie;
    const pointsFor =
      regularSeason.hasRegularSeasonHistory && matchupPointsFor != null
        ? matchupPointsFor
        : standingsPointsFor;
    const pointsAgainst =
      regularSeason.hasRegularSeasonHistory && matchupPointsAgainst != null
        ? matchupPointsAgainst
        : standingsPointsAgainst;
    const highPoints = regularSeason.hasRegularSeasonHistory
      ? (matchupHighPointFinishes ?? 0)
      : (entry.points?.highPoints ?? 0);
    const lowPoints = regularSeason.hasRegularSeasonHistory
      ? (matchupLowPointFinishes ?? 0)
      : (entry.points?.lowPoints ?? null);
    const gp = win + loss + tie;
    const winPct = gp > 0 ? ((win + tie * 0.5) / gp) * 100 : 0;
    const diff = pointsFor - pointsAgainst;

    return {
      standingsWin,
      standingsLoss,
      standingsTie,
      standingsPointsFor,
      standingsPointsAgainst,
      matchupWin,
      matchupLoss,
      matchupTie,
      matchupPointsFor,
      matchupPointsAgainst,
      win,
      loss,
      tie,
      pointsFor,
      pointsAgainst,
      highPoints,
      lowPoints,
      gp,
      winPct,
      diff,
    };
  }

  private logConflicts(
    seasonId: string | null,
    team: string,
    stats: ResolvedTeamStats,
    regularSeason: TeamRecordByTeam
  ): void {
    if (seasonId == null || !regularSeason.hasRegularSeasonHistory) return;

    if (stats.matchupWin != null && stats.matchupWin !== stats.standingsWin) {
      this.logRecordConflict(seasonId, team, 'wins', stats.standingsWin, stats.matchupWin);
    }
    if (stats.matchupLoss != null && stats.matchupLoss !== stats.standingsLoss) {
      this.logRecordConflict(
        seasonId,
        team,
        'losses',
        stats.standingsLoss,
        stats.matchupLoss
      );
    }
    if (stats.matchupTie != null && stats.matchupTie !== stats.standingsTie) {
      this.logRecordConflict(seasonId, team, 'ties', stats.standingsTie, stats.matchupTie);
    }
    if (
      stats.matchupPointsFor != null &&
      Math.abs(stats.matchupPointsFor - stats.standingsPointsFor) >= EPSILON
    ) {
      this.logRecordConflict(
        seasonId,
        team,
        'pointsFor',
        stats.standingsPointsFor,
        stats.matchupPointsFor
      );
    }
    if (
      stats.matchupPointsAgainst != null &&
      Math.abs(stats.matchupPointsAgainst - stats.standingsPointsAgainst) >= EPSILON
    ) {
      this.logRecordConflict(
        seasonId,
        team,
        'pointsAgainst',
        stats.standingsPointsAgainst,
        stats.matchupPointsAgainst
      );
    }
  }

  private toStandingsRow(
    entry: SeasonStandingsEntry,
    team: string,
    stats: ResolvedTeamStats
  ): SeasonStandingsRow {
    const rawPlayoffRank = entry.ranks?.playoffRank;
    const rawRegularSeasonRank = entry.ranks?.regularSeasonRank;

    return {
      playoffRank:
        rawPlayoffRank != null && String(rawPlayoffRank).trim() !== ''
          ? String(rawPlayoffRank).trim()
          : null,
      regularSeasonRank: parseRank(rawRegularSeasonRank),
      teamName: team,
      managerName: entry.playerDetails?.managerName ?? '',
      win: stats.win,
      loss: stats.loss,
      tie: stats.tie,
      gp: stats.gp,
      winPct: stats.winPct,
      pointsFor: stats.pointsFor,
      pointsAgainst: stats.pointsAgainst,
      highPoints: stats.highPoints,
      lowPoints: stats.lowPoints,
      diff: stats.diff,
      moves: entry.transactions?.moves ?? 0,
      trades: entry.transactions?.trades ?? 0,
    };
  }

  toTableState(standings: SeasonStandings | null): SeasonStandingsTableState {
    if (!standings) return { columns: this.getColumns(false), data: [] };

    const seasonId = this.getSeasonId(standings);
    const regularSeason =
      seasonId != null
        ? this.getRegularSeasonRecordByTeam(seasonId)
        : {
            winsByTeam: new Map<string, number>(),
            lossesByTeam: new Map<string, number>(),
            tiesByTeam: new Map<string, number>(),
            pointsForByTeam: new Map<string, number>(),
            pointsAgainstByTeam: new Map<string, number>(),
            highPointFinishesByTeam: new Map<string, number>(),
            lowPointFinishesByTeam: new Map<string, number>(),
            hasRegularSeasonHistory: false,
          };
    const hasWeeklyHistory = regularSeason.hasRegularSeasonHistory;

    const entries = Object.values(standings);
    const resolvedByTeam = new Map<string, ResolvedTeamStats>();
    for (const entry of entries) {
      const team = teamName(entry);
      const normalizedTeam = normalizeTeamName(team);
      resolvedByTeam.set(normalizedTeam, this.resolveTeamStats(entry, normalizedTeam, regularSeason));
    }

    const rows = entries.map((entry): SeasonStandingsRow => {
      const team = teamName(entry);
      const normalizedTeam = normalizeTeamName(team);
      const stats = resolvedByTeam.get(normalizedTeam)!;
      this.logConflicts(seasonId, team, stats, regularSeason);
      return this.toStandingsRow(entry, team, stats);
    });

    const computedRegularSeasonRanks = buildRegularSeasonRanks(rows);

    const normalizedRows = rows
      .map((row) => ({
        ...row,
        regularSeasonRank:
          row.regularSeasonRank ?? computedRegularSeasonRanks.get(row) ?? null,
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

