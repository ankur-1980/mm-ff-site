import { inject, Injectable } from '@angular/core';

import type {
  SeasonStandings,
  SeasonStandingsEntry,
} from '../../../models/season-standings.model';
import type { DataTableColumnDef, DataTableRow } from '../../../shared/table';
import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import { LoggerService } from '@ankur-1980/logger';

export interface SeasonStandingsRow extends DataTableRow {
  playoffRank: string | null;
  regularSeasonRank: number | null;
  teamName: string;
  managerName: string;
  win: number;
  loss: number;
  tie: number;
  gp: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
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

function addPoints(map: Map<string, number>, key: string, value: number): void {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + value);
}

interface TeamRecordByTeam {
  winsByTeam: Map<string, number>;
  lossesByTeam: Map<string, number>;
  tiesByTeam: Map<string, number>;
  pointsForByTeam: Map<string, number>;
  pointsAgainstByTeam: Map<string, number>;
  highPointFinishesByTeam: Map<string, number>;
  lowPointFinishesByTeam: Map<string, number>;
  hasRegularSeasonHistory: boolean;
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

  toTableState(standings: SeasonStandings | null): SeasonStandingsTableState {
    if (!standings) return { columns: this.getColumns(false), data: [] };

    const seasonId = this.getSeasonId(standings);
    const {
      winsByTeam,
      lossesByTeam,
      tiesByTeam,
      pointsForByTeam,
      pointsAgainstByTeam,
      highPointFinishesByTeam,
      lowPointFinishesByTeam,
      hasRegularSeasonHistory,
    } =
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
    const hasWeeklyHistory = hasRegularSeasonHistory;

    const rows = Object.values(standings)
      .map((entry): SeasonStandingsRow => {
        const standingsWin = entry.record?.win ?? 0;
        const standingsLoss = entry.record?.loss ?? 0;
        const standingsTie = entry.record?.tie ?? 0;
        const standingsPointsFor = entry.points?.pointsFor ?? 0;
        const standingsPointsAgainst = entry.points?.pointsAgainst ?? 0;
        const team = teamName(entry);
        const normalizedTeam = normalizeTeamName(team);
        const matchupWin = winsByTeam.get(normalizedTeam);
        const matchupLoss = lossesByTeam.get(normalizedTeam);
        const matchupTie = tiesByTeam.get(normalizedTeam);
        const matchupPointsFor = pointsForByTeam.get(normalizedTeam);
        const matchupPointsAgainst = pointsAgainstByTeam.get(normalizedTeam);
        const matchupHighPointFinishes = highPointFinishesByTeam.get(normalizedTeam);
        const matchupLowPointFinishes = lowPointFinishesByTeam.get(normalizedTeam);
        const win = hasRegularSeasonHistory && matchupWin != null ? matchupWin : standingsWin;
        const loss =
          hasRegularSeasonHistory && matchupLoss != null ? matchupLoss : standingsLoss;
        const tie = hasRegularSeasonHistory && matchupTie != null ? matchupTie : standingsTie;
        const pointsFor =
          hasRegularSeasonHistory && matchupPointsFor != null
            ? matchupPointsFor
            : standingsPointsFor;
        const pointsAgainst =
          hasRegularSeasonHistory && matchupPointsAgainst != null
            ? matchupPointsAgainst
            : standingsPointsAgainst;
        if (
          seasonId != null &&
          hasRegularSeasonHistory &&
          matchupWin != null &&
          matchupWin !== standingsWin
        ) {
          this.logRecordConflict(seasonId, team, 'wins', standingsWin, matchupWin);
        }
        if (
          seasonId != null &&
          hasRegularSeasonHistory &&
          matchupLoss != null &&
          matchupLoss !== standingsLoss
        ) {
          this.logRecordConflict(seasonId, team, 'losses', standingsLoss, matchupLoss);
        }
        if (
          seasonId != null &&
          hasRegularSeasonHistory &&
          matchupTie != null &&
          matchupTie !== standingsTie
        ) {
          this.logRecordConflict(seasonId, team, 'ties', standingsTie, matchupTie);
        }
        if (
          seasonId != null &&
          hasRegularSeasonHistory &&
          matchupPointsFor != null &&
          Math.abs(matchupPointsFor - standingsPointsFor) >= EPSILON
        ) {
          this.logRecordConflict(
            seasonId,
            team,
            'pointsFor',
            standingsPointsFor,
            matchupPointsFor
          );
        }
        if (
          seasonId != null &&
          hasRegularSeasonHistory &&
          matchupPointsAgainst != null &&
          Math.abs(matchupPointsAgainst - standingsPointsAgainst) >= EPSILON
        ) {
          this.logRecordConflict(
            seasonId,
            team,
            'pointsAgainst',
            standingsPointsAgainst,
            matchupPointsAgainst
          );
        }
        const gp = win + loss + tie;
        const highPoints = hasWeeklyHistory
          ? (matchupHighPointFinishes ?? 0)
          : (entry.points?.highPoints ?? 0);
        const lowPoints = hasWeeklyHistory
          ? (matchupLowPointFinishes ?? 0)
          : (entry.points?.lowPoints ?? null);
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
          win,
          loss,
          tie,
          gp,
          winPct: gp > 0 ? ((win + tie * 0.5) / gp) * 100 : 0,
          pointsFor,
          pointsAgainst,
          highPoints,
          lowPoints,
          diff: pointsFor - pointsAgainst,
          moves: entry.transactions?.moves ?? 0,
          trades: entry.transactions?.trades ?? 0,
        };
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

