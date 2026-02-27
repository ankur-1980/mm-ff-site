import { inject, Injectable } from '@angular/core';
import { LoggerService } from '@ankur-1980/logger';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { OwnersDataService } from '../../../data/owners-data.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import type { DataTableColumnDef } from '../../../shared/table';
import type {
  AllTimeRecordRow,
  AllTimeRecordsTableState,
  ChampionTimelineEntry,
  OwnerRecordTotals,
  SeasonHighPointsTimelineEntry,
  StarterSeasonRecordEntry,
  StarterSingleGameRecordEntry,
} from './records.models';

const EPSILON = 0.000001;

function normalize(value: string | null | undefined): string {
  return value != null ? String(value).trim().toLowerCase() : '';
}

function addToTotals(target: OwnerRecordTotals, source: OwnerRecordTotals): void {
  target.wins += source.wins;
  target.losses += source.losses;
  target.ties += source.ties;
  target.allPlayWins += source.allPlayWins;
  target.allPlayLosses += source.allPlayLosses;
  target.allPlayTies += source.allPlayTies;
  target.championships += source.championships;
  target.highPoints += source.highPoints;
  target.lowPoints += source.lowPoints;
  target.moves += source.moves;
  target.trades += source.trades;
  target.pointsFor += source.pointsFor;
  target.pointsAgainst += source.pointsAgainst;
}

function emptyTotals(): OwnerRecordTotals {
  return {
    wins: 0,
    losses: 0,
    ties: 0,
    allPlayWins: 0,
    allPlayLosses: 0,
    allPlayTies: 0,
    championships: 0,
    highPoints: 0,
    lowPoints: 0,
    moves: 0,
    trades: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
}

function addStandingsOnly(target: OwnerRecordTotals, source: OwnerRecordTotals): void {
  target.championships += source.championships;
  target.moves += source.moves;
  target.trades += source.trades;
}

interface TeamOwnerIndex {
  ownerByTeam: Map<string, string>;
  ambiguousTeams: Set<string>;
}

interface DerivedSeasonTotals {
  hasRegularSeasonHistory: boolean;
  totalsByOwner: Map<string, OwnerRecordTotals>;
}

@Injectable({ providedIn: 'root' })
export class AllTimeRecordsService {
  private readonly ownersData = inject(OwnersDataService);
  private readonly weeklyMatchupsData = inject(WeeklyMatchupsDataService);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly leagueMetaData = inject(LeagueMetaDataService);
  private readonly logger = inject(LoggerService);

  private readonly loggedTeamMappingErrors = new Set<string>();
  private readonly loggedOwnerMismatchErrors = new Set<string>();

  readonly columns: DataTableColumnDef[] = [
    { key: 'ownerName', header: 'Owner Name', widthCh: 22 },
    { key: 'totalSeasons', header: 'Seasons', widthCh: 8, format: 'integer' },
    { key: 'wins', header: 'W', widthCh: 6, format: 'integer', defaultSort: true },
    { key: 'losses', header: 'L', widthCh: 6, format: 'integer' },
    { key: 'ties', header: 'T', widthCh: 6, format: 'integer' },
    { key: 'allPlayWins', header: 'All-Play W', widthCh: 10, format: 'integer' },
    { key: 'allPlayLosses', header: 'All-Play L', widthCh: 10, format: 'integer' },
    { key: 'allPlayWinPct', header: 'All-Play Win %', widthCh: 13, format: 'percent2' },
    { key: 'championships', header: 'Champs', widthCh: 8, format: 'integer' },
    { key: 'gp', header: 'GP', widthCh: 6, format: 'integer' },
    { key: 'winPct', header: 'Win Pct%', widthCh: 10, format: 'percent2' },
    { key: 'pointsFor', header: 'PF', widthCh: 12, format: 'decimal2' },
    { key: 'avgPointsPerSeason', header: 'Avg Pts/Season', widthCh: 13, format: 'decimal2' },
    { key: 'pointsAgainst', header: 'PA', widthCh: 12, format: 'decimal2' },
    { key: 'pointsDiff', header: 'Diff', widthCh: 12, format: 'signedDecimal2' },
    { key: 'ppgAvg', header: 'PPG Avg', widthCh: 10, format: 'decimal2' },
    { key: 'highPoints', header: 'High Pts', widthCh: 9, format: 'smartDecimal2' },
    { key: 'lowPoints', header: 'Low Pts', widthCh: 9, format: 'smartDecimal2' },
    { key: 'moves', header: 'Moves', widthCh: 7, format: 'integer' },
    { key: 'trades', header: 'Trades', widthCh: 7, format: 'integer' },
  ];

  private buildTeamOwnerIndex(): TeamOwnerIndex {
    const ownerByTeam = new Map<string, string>();
    const ambiguousTeams = new Set<string>();

    for (const owner of this.ownersData.allOwners()) {
      for (const teamName of owner.teamNames ?? []) {
        const key = normalize(teamName);
        if (!key) continue;
        if (ambiguousTeams.has(key)) continue;

        const existingOwner = ownerByTeam.get(key);
        if (existingOwner && existingOwner !== owner.managerName) {
          ownerByTeam.delete(key);
          ambiguousTeams.add(key);
          continue;
        }

        ownerByTeam.set(key, owner.managerName);
      }
    }

    return { ownerByTeam, ambiguousTeams };
  }

  private resolveOwnerByTeamName(
    seasonId: string,
    teamName: string | null | undefined,
    sourceContext: string,
    teamIndex: TeamOwnerIndex
  ): string | null {
    const key = normalize(teamName);
    if (!key) {
      const errorKey = `${seasonId}|blank|${sourceContext}`;
      if (!this.loggedTeamMappingErrors.has(errorKey)) {
        this.loggedTeamMappingErrors.add(errorKey);
        this.logger.error(
          `AllTimeRecordsService: skipped ${sourceContext} in season ${seasonId} due to missing team name`
        );
      }
      return null;
    }

    if (teamIndex.ambiguousTeams.has(key)) {
      const errorKey = `${seasonId}|ambiguous|${key}|${sourceContext}`;
      if (!this.loggedTeamMappingErrors.has(errorKey)) {
        this.loggedTeamMappingErrors.add(errorKey);
        this.logger.error(
          `AllTimeRecordsService: skipped ${sourceContext} in season ${seasonId}; ambiguous team name "${teamName}"`
        );
      }
      return null;
    }

    const owner = teamIndex.ownerByTeam.get(key);
    if (!owner) {
      const errorKey = `${seasonId}|missing-owner|${key}|${sourceContext}`;
      if (!this.loggedTeamMappingErrors.has(errorKey)) {
        this.loggedTeamMappingErrors.add(errorKey);
        this.logger.error(
          `AllTimeRecordsService: skipped ${sourceContext} in season ${seasonId}; no owner found for team "${teamName}"`
        );
      }
      return null;
    }

    return owner;
  }

  private deriveRegularSeasonTotalsByOwner(
    seasonId: string,
    teamIndex: TeamOwnerIndex
  ): DerivedSeasonTotals {
    const totalsByOwner = new Map<string, OwnerRecordTotals>();
    const meta = this.leagueMetaData.getSeasonMeta(seasonId);
    if (!meta) return { hasRegularSeasonHistory: false, totalsByOwner };

    let matchupCount = 0;
    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(seasonId, `week${week}`);
      if (!weekData) continue;

      const weeklyScores: Array<{ owner: string; score: number }> = [];
      const seenMatchups = new Set<string>();
      for (const entry of Object.values(weekData)) {
        const weekOwner = this.resolveOwnerByTeamName(
          seasonId,
          entry.matchup?.team1Name,
          `weekly score week${week}`,
          teamIndex
        );
        const weekScore = Number(entry.team1Totals?.totalPoints);
        if (weekOwner && Number.isFinite(weekScore)) {
          weeklyScores.push({ owner: weekOwner, score: weekScore });
        }

        const matchup = entry.matchup;
        if (!matchup?.team1Name || !matchup?.team2Name) continue;

        const matchupKey = [matchup.team1Id, matchup.team2Id].sort().join('|');
        if (seenMatchups.has(matchupKey)) continue;
        seenMatchups.add(matchupKey);

        const team1Score = Number(matchup.team1Score);
        const team2Score = Number(matchup.team2Score);
        if (Number.isNaN(team1Score) || Number.isNaN(team2Score)) continue;

        const owner1 = this.resolveOwnerByTeamName(
          seasonId,
          matchup.team1Name,
          `weekly matchup week${week}`,
          teamIndex
        );
        const owner2 = this.resolveOwnerByTeamName(
          seasonId,
          matchup.team2Name,
          `weekly matchup week${week}`,
          teamIndex
        );
        if (!owner1 || !owner2) continue;

        matchupCount += 1;
        const owner1Totals = totalsByOwner.get(owner1) ?? emptyTotals();
        const owner2Totals = totalsByOwner.get(owner2) ?? emptyTotals();

        if (team1Score > team2Score) {
          owner1Totals.wins += 1;
          owner2Totals.losses += 1;
        } else if (team2Score > team1Score) {
          owner2Totals.wins += 1;
          owner1Totals.losses += 1;
        } else {
          owner1Totals.ties += 1;
          owner2Totals.ties += 1;
        }
        owner1Totals.pointsFor += team1Score;
        owner1Totals.pointsAgainst += team2Score;
        owner2Totals.pointsFor += team2Score;
        owner2Totals.pointsAgainst += team1Score;

        totalsByOwner.set(owner1, owner1Totals);
        totalsByOwner.set(owner2, owner2Totals);
      }

      if (weeklyScores.length > 0) {
        const topScore = Math.max(...weeklyScores.map((s) => s.score));
        const lowScore = Math.min(...weeklyScores.map((s) => s.score));
        for (const row of weeklyScores) {
          const totals = totalsByOwner.get(row.owner) ?? emptyTotals();
          if (Math.abs(row.score - topScore) < EPSILON) totals.highPoints += 1;
          if (Math.abs(row.score - lowScore) < EPSILON) totals.lowPoints += 1;
          totalsByOwner.set(row.owner, totals);
        }
      }
    }

    return { hasRegularSeasonHistory: matchupCount > 0, totalsByOwner };
  }

  private addAllPlayTotalsForSeason(
    seasonId: string,
    teamIndex: TeamOwnerIndex,
    totalsByOwner: Map<string, OwnerRecordTotals>
  ): void {
    const meta = this.leagueMetaData.getSeasonMeta(seasonId);
    const season = this.weeklyMatchupsData.getSeasonWeeks(seasonId);
    if (!meta || !season) return;

    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = season[`week${week}`];
      if (!weekData) continue;

      const ownerScores = new Map<string, number>();
      for (const entry of Object.values(weekData)) {
        const owner = this.resolveOwnerByTeamName(
          seasonId,
          entry.matchup?.team1Name,
          `all-play week${week}`,
          teamIndex
        );
        const score = Number(entry.team1Totals?.totalPoints);
        if (!owner || !Number.isFinite(score)) continue;
        if (!ownerScores.has(owner)) ownerScores.set(owner, score);
      }

      const owners = Array.from(ownerScores.keys());
      if (owners.length < 2) continue;

      for (const owner of owners) {
        const rowTotals = totalsByOwner.get(owner) ?? emptyTotals();
        const rowScore = ownerScores.get(owner)!;

        for (const opponent of owners) {
          if (opponent === owner) continue;
          const opponentScore = ownerScores.get(opponent)!;
          const diff = rowScore - opponentScore;
          if (diff > EPSILON) rowTotals.allPlayWins += 1;
          else if (diff < -EPSILON) rowTotals.allPlayLosses += 1;
          else rowTotals.allPlayTies += 1;
        }

        totalsByOwner.set(owner, rowTotals);
      }
    }
  }

  private fallbackSeasonTotalsFromStandings(
    seasonId: string,
    teamIndex: TeamOwnerIndex
  ): Map<string, OwnerRecordTotals> {
    const totalsByOwner = new Map<string, OwnerRecordTotals>();
    const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
    if (!standings) return totalsByOwner;

    for (const entry of Object.values(standings)) {
      const team = entry.playerDetails?.teamName ?? '';
      const owner = this.resolveOwnerByTeamName(
        seasonId,
        team,
        'season standings fallback',
        teamIndex
      );
      if (!owner) continue;

      const totals = totalsByOwner.get(owner) ?? emptyTotals();
      totals.wins += entry.record?.win ?? 0;
      totals.losses += entry.record?.loss ?? 0;
      totals.ties += entry.record?.tie ?? 0;
      const playoffRank = Number.parseInt(String(entry.ranks?.playoffRank ?? '').trim(), 10);
      if (Number.isFinite(playoffRank) && playoffRank === 1) totals.championships += 1;
      totals.highPoints += entry.points?.highPoints ?? 0;
      totals.lowPoints += entry.points?.lowPoints ?? 0;
      totals.moves += entry.transactions?.moves ?? 0;
      totals.trades += entry.transactions?.trades ?? 0;
      totals.pointsFor += entry.points?.pointsFor ?? 0;
      totals.pointsAgainst += entry.points?.pointsAgainst ?? 0;
      totalsByOwner.set(owner, totals);
    }

    return totalsByOwner;
  }

  private ownerHasCompleteDerivedHistory(
    ownerId: string,
    activeSeasons: number[],
    derivedBySeason: Map<string, DerivedSeasonTotals>
  ): boolean {
    for (const season of activeSeasons) {
      const seasonId = String(season);
      const derived = derivedBySeason.get(seasonId);
      if (!derived || !derived.hasRegularSeasonHistory) return false;
      if (!derived.totalsByOwner.has(ownerId)) return false;
    }
    return true;
  }

  private logOwnerMismatchIfNeeded(
    row: AllTimeRecordRow,
    expected: Pick<OwnerRecordTotals, 'wins' | 'losses' | 'ties'>,
    isDerivedComplete: boolean
  ): void {
    if (!isDerivedComplete) return;
    if (
      row.wins === expected.wins &&
      row.losses === expected.losses &&
      row.ties === expected.ties
    ) {
      return;
    }

    const key = `${row.ownerName}|${row.wins}|${row.losses}|${row.ties}|${expected.wins}|${expected.losses}|${expected.ties}`;
    if (this.loggedOwnerMismatchErrors.has(key)) return;
    this.loggedOwnerMismatchErrors.add(key);

    this.logger.error(
      `AllTimeRecordsService: owner totals mismatch for ${row.ownerName} ` +
        `(derived=${row.wins}-${row.losses}-${row.ties}, owners=${expected.wins}-${expected.losses}-${expected.ties})`
    );
  }

  toTableState(): AllTimeRecordsTableState {
    const owners = this.ownersData.allOwners();
    if (!owners.length) return { columns: this.columns, data: [] };

    const teamIndex = this.buildTeamOwnerIndex();

    const seasonIds = new Set<string>([
      ...this.seasonStandingsData.seasonIds(),
      ...this.weeklyMatchupsData.seasonIds(),
    ]);

    const derivedBySeason = new Map<string, DerivedSeasonTotals>();
    const fallbackBySeason = new Map<string, Map<string, OwnerRecordTotals>>();

    for (const seasonId of seasonIds) {
      derivedBySeason.set(
        seasonId,
        this.deriveRegularSeasonTotalsByOwner(seasonId, teamIndex)
      );
      fallbackBySeason.set(
        seasonId,
        this.fallbackSeasonTotalsFromStandings(seasonId, teamIndex)
      );
    }

    const allTimeByOwner = new Map<string, OwnerRecordTotals>();
    for (const owner of owners) {
      allTimeByOwner.set(owner.managerName, emptyTotals());
    }

    for (const seasonId of seasonIds) {
      const derived = derivedBySeason.get(seasonId);
      const fallback = fallbackBySeason.get(seasonId);
      const useDerived = derived?.hasRegularSeasonHistory === true;

      for (const owner of owners) {
        const ownerId = owner.managerName;
        const totals = allTimeByOwner.get(ownerId)!;
        const fallbackTotals = fallback?.get(ownerId);
        if (useDerived && derived?.totalsByOwner.has(ownerId)) {
          addToTotals(totals, derived.totalsByOwner.get(ownerId)!);
          if (fallbackTotals) addStandingsOnly(totals, fallbackTotals);
          continue;
        }
        if (fallbackTotals) {
          addToTotals(totals, fallbackTotals);
        }
      }

      // All-play totals are always derived from weekly regular-season data where available.
      this.addAllPlayTotalsForSeason(seasonId, teamIndex, allTimeByOwner);
    }

    const ownerRankByName = new Map<string, number>(
      owners
        .map((o) => o.managerName)
        .sort((a, b) => a.localeCompare(b))
        .map((name, index) => [name, index] as const)
    );

    const rows: AllTimeRecordRow[] = owners
      .map((owner) => {
        const totals = allTimeByOwner.get(owner.managerName) ?? emptyTotals();
        const totalSeasons = (owner.activeSeasons?.length ?? 0) || owner.seasonsPlayed || 0;
        const gp = totals.wins + totals.losses + totals.ties;
        const winPct = gp > 0 ? ((totals.wins + 0.5 * totals.ties) / gp) * 100 : 0;
        const ppgAvg = gp > 0 ? totals.pointsFor / gp : 0;
        const avgPointsPerSeason = totalSeasons > 0 ? totals.pointsFor / totalSeasons : 0;
        const pointsDiff = totals.pointsFor - totals.pointsAgainst;
        const allPlayGames = totals.allPlayWins + totals.allPlayLosses + totals.allPlayTies;
        const allPlayWinPct =
          allPlayGames > 0
            ? ((totals.allPlayWins + 0.5 * totals.allPlayTies) / allPlayGames) * 100
            : 0;
        const ownerRank = ownerRankByName.get(owner.managerName) ?? 999;
        return {
          ownerName: owner.managerName,
          totalSeasons,
          wins: totals.wins,
          losses: totals.losses,
          ties: totals.ties,
          allPlayWins: totals.allPlayWins,
          allPlayLosses: totals.allPlayLosses,
          allPlayWinPct,
          championships: totals.championships,
          highPoints: totals.highPoints,
          lowPoints: totals.lowPoints,
          moves: totals.moves,
          trades: totals.trades,
          pointsFor: totals.pointsFor,
          avgPointsPerSeason,
          pointsAgainst: totals.pointsAgainst,
          pointsDiff,
          gp,
          winPct,
          ppgAvg,
          // Tie-break order packed for default W sort (desc):
          // wins desc, losses asc, ties desc, ownerName asc.
          winSortValue:
            totals.wins * 1_000_000_000 +
            (1_000 - totals.losses) * 1_000_000 +
            totals.ties * 1_000 +
            (1_000 - ownerRank),
        };
      })
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        if (b.ties !== a.ties) return b.ties - a.ties;
        return a.ownerName.localeCompare(b.ownerName);
      });

    for (const owner of owners) {
      const row = rows.find((r) => r.ownerName === owner.managerName);
      if (!row) continue;
      const isComplete = this.ownerHasCompleteDerivedHistory(
        owner.managerName,
        owner.activeSeasons ?? [],
        derivedBySeason
      );
      this.logOwnerMismatchIfNeeded(row, owner, isComplete);
    }

    return { columns: this.columns, data: rows };
  }

  getChampionsTimeline(): ChampionTimelineEntry[] {
    const rows: ChampionTimelineEntry[] = [];
    const seasonIds = this.seasonStandingsData
      .seasonIds()
      .sort((a, b) => Number(b) - Number(a));

    for (const seasonId of seasonIds) {
      const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
      if (!standings) continue;

      const champions = Object.values(standings)
        .filter((entry) => {
          const rank = Number.parseInt(String(entry.ranks?.playoffRank ?? '').trim(), 10);
          return Number.isFinite(rank) && rank === 1;
        })
        .map((entry) => ({
          year: seasonId,
          ownerName: entry.playerDetails?.managerName ?? 'Unknown Owner',
          teamName: entry.playerDetails?.teamName ?? 'Unknown Team',
        }))
        .sort((a, b) => a.ownerName.localeCompare(b.ownerName));

      rows.push(...champions);
    }

    return rows;
  }

  getSeasonHighPointsTimeline(): SeasonHighPointsTimelineEntry[] {
    const rows: SeasonHighPointsTimelineEntry[] = [];
    const seasonIds = this.seasonStandingsData
      .seasonIds()
      .sort((a, b) => Number(b) - Number(a));

    for (const seasonId of seasonIds) {
      const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
      if (!standings) continue;

      const entries = Object.values(standings);
      if (!entries.length) continue;

      const topPoints = Math.max(...entries.map((entry) => entry.points?.pointsFor ?? 0));
      const winners = entries
        .filter((entry) => Math.abs((entry.points?.pointsFor ?? 0) - topPoints) < EPSILON)
        .map((entry) => ({
          year: seasonId,
          points: topPoints,
          ownerName: entry.playerDetails?.managerName ?? 'Unknown Owner',
        }))
        .sort((a, b) => a.ownerName.localeCompare(b.ownerName));

      rows.push(...winners);
    }

    return rows;
  }

  getTopStarterSingleGameRecords(limit = 10): StarterSingleGameRecordEntry[] {
    const teamIndex = this.buildTeamOwnerIndex();
    const rows: StarterSingleGameRecordEntry[] = [];

    for (const seasonId of this.weeklyMatchupsData.seasonIds()) {
      const seasonWeeks = this.weeklyMatchupsData.getSeasonWeeks(seasonId);
      if (!seasonWeeks) continue;

      for (const weekKey of this.weeklyMatchupsData.getWeekKeysForSeason(seasonId)) {
        const weekEntries = seasonWeeks[weekKey];
        if (!weekEntries) continue;

        for (const entry of Object.values(weekEntries)) {
          const ownerName = this.resolveOwnerByTeamName(
            seasonId,
            entry.matchup?.team1Name,
            `starter single game ${weekKey}`,
            teamIndex
          );
          if (!ownerName) continue;

          for (const starter of entry.team1Roster.filter(
            (player) => player.slot === 'starter'
          )) {
            rows.push({
              ownerName,
              playerName: starter.playerName,
              points: starter.points,
              year: entry.season,
              week: entry.week,
            });
          }
        }
      }
    }

    return rows
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.year !== a.year) return b.year - a.year;
        if (b.week !== a.week) return b.week - a.week;
        if (a.ownerName !== b.ownerName) return a.ownerName.localeCompare(b.ownerName);
        return a.playerName.localeCompare(b.playerName);
      })
      .slice(0, limit);
  }

  getTopStarterSeasonRecords(limit = 10): StarterSeasonRecordEntry[] {
    const teamIndex = this.buildTeamOwnerIndex();
    const seasonTotals = new Map<
      string,
      { ownerName: string; playerName: string; points: number; year: number }
    >();

    for (const seasonId of this.weeklyMatchupsData.seasonIds()) {
      const seasonWeeks = this.weeklyMatchupsData.getSeasonWeeks(seasonId);
      if (!seasonWeeks) continue;

      for (const weekKey of this.weeklyMatchupsData.getWeekKeysForSeason(seasonId)) {
        const weekEntries = seasonWeeks[weekKey];
        if (!weekEntries) continue;

        for (const entry of Object.values(weekEntries)) {
          const ownerName = this.resolveOwnerByTeamName(
            seasonId,
            entry.matchup?.team1Name,
            `starter season ${weekKey}`,
            teamIndex
          );
          if (!ownerName) continue;

          for (const starter of entry.team1Roster.filter(
            (player) => player.slot === 'starter'
          )) {
            const recordKey = `${entry.season}|${ownerName}|${starter.playerId}`;
            const existing = seasonTotals.get(recordKey);

            if (existing) {
              existing.points += starter.points;
            } else {
              seasonTotals.set(recordKey, {
                ownerName,
                playerName: starter.playerName,
                points: starter.points,
                year: entry.season,
              });
            }
          }
        }
      }
    }

    return Array.from(seasonTotals.values())
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.year !== a.year) return b.year - a.year;
        if (a.ownerName !== b.ownerName) return a.ownerName.localeCompare(b.ownerName);
        return a.playerName.localeCompare(b.playerName);
      })
      .slice(0, limit);
  }
}
