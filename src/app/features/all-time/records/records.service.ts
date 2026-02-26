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
  OwnerRecordTotals,
} from './records.models';

function normalize(value: string | null | undefined): string {
  return value != null ? String(value).trim().toLowerCase() : '';
}

function addToTotals(target: OwnerRecordTotals, source: OwnerRecordTotals): void {
  target.wins += source.wins;
  target.losses += source.losses;
  target.ties += source.ties;
}

function emptyTotals(): OwnerRecordTotals {
  return { wins: 0, losses: 0, ties: 0 };
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
    { key: 'wins', header: 'W', widthCh: 6, format: 'integer', defaultSort: true },
    { key: 'losses', header: 'L', widthCh: 6, format: 'integer' },
    { key: 'ties', header: 'T', widthCh: 6, format: 'integer' },
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

        totalsByOwner.set(owner1, owner1Totals);
        totalsByOwner.set(owner2, owner2Totals);
      }
    }

    return { hasRegularSeasonHistory: matchupCount > 0, totalsByOwner };
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
    expected: OwnerRecordTotals,
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
        if (useDerived && derived?.totalsByOwner.has(ownerId)) {
          addToTotals(totals, derived.totalsByOwner.get(ownerId)!);
          continue;
        }
        if (fallback?.has(ownerId)) {
          addToTotals(totals, fallback.get(ownerId)!);
        }
      }
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
        const ownerRank = ownerRankByName.get(owner.managerName) ?? 999;
        return {
          ownerName: owner.managerName,
          wins: totals.wins,
          losses: totals.losses,
          ties: totals.ties,
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
}
