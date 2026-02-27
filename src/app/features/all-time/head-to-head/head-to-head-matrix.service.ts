import { inject, Injectable } from '@angular/core';
import { LoggerService } from '@ankur-1980/logger';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { OwnersDataService } from '../../../data/owners-data.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import type {
  AllPlayMatrixResult,
  AllPlayPairRecord,
} from '../../season/season-analytics/all-play-matrix.models';

const EPSILON = 0.000001;

function normalize(value: string | null | undefined): string {
  return value != null ? String(value).trim().toLowerCase() : '';
}

interface OwnerIndex {
  ownerByTeam: Map<string, string>;
  ambiguousTeams: Set<string>;
}

@Injectable({ providedIn: 'root' })
export class HeadToHeadMatrixService {
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);
  private readonly owners = inject(OwnersDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);
  private readonly seasonStandings = inject(SeasonStandingsDataService);
  private readonly logger = inject(LoggerService);

  private readonly loggedMappingErrors = new Set<string>();

  private buildFallbackOwnerIndex(): OwnerIndex {
    const ownerByTeam = new Map<string, string>();
    const ambiguousTeams = new Set<string>();

    for (const owner of this.owners.allOwners()) {
      for (const teamName of owner.teamNames ?? []) {
        const key = normalize(teamName);
        if (!key) continue;
        if (ambiguousTeams.has(key)) continue;

        const existing = ownerByTeam.get(key);
        if (existing && existing !== owner.managerName) {
          ownerByTeam.delete(key);
          ambiguousTeams.add(key);
          continue;
        }

        ownerByTeam.set(key, owner.managerName);
      }
    }

    return { ownerByTeam, ambiguousTeams };
  }

  private buildSeasonOwnerIndex(seasonId: string): OwnerIndex | null {
    const standings = this.seasonStandings.getStandingsForSeason(seasonId);
    if (!standings) return null;

    const ownerByTeam = new Map<string, string>();
    const ambiguousTeams = new Set<string>();

    for (const entry of Object.values(standings)) {
      const teamName = entry.playerDetails?.teamName;
      const managerName = entry.playerDetails?.managerName;
      const key = normalize(teamName);
      if (!key || !managerName) continue;
      if (ambiguousTeams.has(key)) continue;

      const existing = ownerByTeam.get(key);
      if (existing && existing !== managerName) {
        ownerByTeam.delete(key);
        ambiguousTeams.add(key);
        continue;
      }

      ownerByTeam.set(key, managerName);
    }

    return { ownerByTeam, ambiguousTeams };
  }

  private resolveOwner(
    seasonId: string,
    weekNum: number,
    teamName: string | null | undefined,
    seasonOwnerIndex: OwnerIndex | null,
    fallbackOwnerIndex: OwnerIndex
  ): string | null {
    const key = normalize(teamName);
    if (!key) return null;

    const activeIndex = seasonOwnerIndex ?? fallbackOwnerIndex;
    if (activeIndex.ambiguousTeams.has(key)) {
      const errorKey = `${seasonId}|${weekNum}|ambiguous|${key}`;
      if (!this.loggedMappingErrors.has(errorKey)) {
        this.loggedMappingErrors.add(errorKey);
        this.logger.error(
          `HeadToHeadMatrixService: ambiguous team mapping in season ${seasonId} week ${weekNum} for "${teamName}"`
        );
      }
      return null;
    }

    const owner = activeIndex.ownerByTeam.get(key);
    if (!owner) {
      const errorKey = `${seasonId}|${weekNum}|missing|${key}`;
      if (!this.loggedMappingErrors.has(errorKey)) {
        this.loggedMappingErrors.add(errorKey);
        this.logger.error(
          `HeadToHeadMatrixService: missing owner mapping in season ${seasonId} week ${weekNum} for "${teamName}"`
        );
      }
      return null;
    }

    return owner;
  }

  buildMatrix(): AllPlayMatrixResult | null {
    const fallbackOwnerIndex = this.buildFallbackOwnerIndex();
    const ownerNames = this.owners
      .allOwners()
      .map((owner) => owner.managerName)
      .sort((a, b) => a.localeCompare(b));
    const seasonIds = this.weeklyMatchups.seasonIds();
    if (!seasonIds.length || !ownerNames.length) return null;

    const pairRecords = new Map<string, AllPlayPairRecord>();
    for (const rowOwner of ownerNames) {
      for (const colOwner of ownerNames) {
        pairRecords.set(`${rowOwner}|${colOwner}`, { wins: 0, losses: 0, ties: 0 });
      }
    }

    let weeksCount = 0;

    for (const seasonId of seasonIds) {
      const meta = this.leagueMeta.getSeasonMeta(seasonId);
      const season = this.weeklyMatchups.getSeasonWeeks(seasonId);
      const seasonOwnerIndex = this.buildSeasonOwnerIndex(seasonId);
      if (!meta || !season) continue;

      for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
        const weekKey = `week${week}`;
        const weekData = season[weekKey];
        if (!weekData) continue;

        const seenMatchups = new Set<string>();
        let hasAnyMatchup = false;

        for (const entry of Object.values(weekData)) {
          const team1Id = String(entry.matchup?.team1Id ?? '').trim();
          const team2Id = String(entry.matchup?.team2Id ?? '').trim();
          const team1Name = entry.matchup?.team1Name ?? '';
          const team2Name = entry.matchup?.team2Name ?? '';

          const keyLeft = team1Id || normalize(team1Name);
          const keyRight = team2Id || normalize(team2Name);
          if (!keyLeft || !keyRight) continue;

          const matchupKey = [keyLeft, keyRight].sort().join('|');
          if (seenMatchups.has(matchupKey)) continue;
          seenMatchups.add(matchupKey);

          const owner1 = this.resolveOwner(
            seasonId,
            week,
            team1Name,
            seasonOwnerIndex,
            fallbackOwnerIndex
          );
          const owner2 = this.resolveOwner(
            seasonId,
            week,
            team2Name,
            seasonOwnerIndex,
            fallbackOwnerIndex
          );
          if (!owner1 || !owner2 || owner1 === owner2) continue;

          const score1 = Number(entry.matchup?.team1Score);
          const score2 = Number(entry.matchup?.team2Score);
          if (!Number.isFinite(score1) || !Number.isFinite(score2)) continue;

          hasAnyMatchup = true;

          const rowVsCol = pairRecords.get(`${owner1}|${owner2}`) ?? { wins: 0, losses: 0, ties: 0 };
          const colVsRow = pairRecords.get(`${owner2}|${owner1}`) ?? { wins: 0, losses: 0, ties: 0 };
          const diff = score1 - score2;

          if (diff > EPSILON) {
            rowVsCol.wins += 1;
            colVsRow.losses += 1;
          } else if (diff < -EPSILON) {
            rowVsCol.losses += 1;
            colVsRow.wins += 1;
          } else {
            rowVsCol.ties += 1;
            colVsRow.ties += 1;
          }

          pairRecords.set(`${owner1}|${owner2}`, rowVsCol);
          pairRecords.set(`${owner2}|${owner1}`, colVsRow);
        }

        if (hasAnyMatchup) weeksCount += 1;
      }
    }

    const getRecord = (rowOwner: string, colOwner: string): AllPlayPairRecord =>
      pairRecords.get(`${rowOwner}|${colOwner}`) ?? { wins: 0, losses: 0, ties: 0 };

    const getTotalRecord = (owner: string): AllPlayPairRecord => {
      let wins = 0;
      let losses = 0;
      let ties = 0;

      for (const other of ownerNames) {
        if (other === owner) continue;
        const record = getRecord(owner, other);
        wins += record.wins;
        losses += record.losses;
        ties += record.ties;
      }

      return { wins, losses, ties };
    };

    return {
      teamNames: ownerNames,
      getRecord,
      getTotalRecord,
      weeksCount,
    };
  }
}
