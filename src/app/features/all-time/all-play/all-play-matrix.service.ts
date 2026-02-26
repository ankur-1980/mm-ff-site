import { inject, Injectable } from '@angular/core';
import { LoggerService } from '@ankur-1980/logger';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { OwnersDataService } from '../../../data/owners-data.service';
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
export class AllTimeAllPlayMatrixService {
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);
  private readonly owners = inject(OwnersDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);
  private readonly logger = inject(LoggerService);

  private readonly loggedMappingErrors = new Set<string>();

  private buildOwnerIndex(): OwnerIndex {
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

  private resolveOwner(
    seasonId: string,
    weekNum: number,
    teamName: string | null | undefined,
    ownerIndex: OwnerIndex
  ): string | null {
    const key = normalize(teamName);
    if (!key) return null;

    if (ownerIndex.ambiguousTeams.has(key)) {
      const errorKey = `${seasonId}|${weekNum}|ambiguous|${key}`;
      if (!this.loggedMappingErrors.has(errorKey)) {
        this.loggedMappingErrors.add(errorKey);
        this.logger.error(
          `AllTimeAllPlayMatrixService: ambiguous team mapping in season ${seasonId} week ${weekNum} for "${teamName}"`
        );
      }
      return null;
    }

    const owner = ownerIndex.ownerByTeam.get(key);
    if (!owner) {
      const errorKey = `${seasonId}|${weekNum}|missing|${key}`;
      if (!this.loggedMappingErrors.has(errorKey)) {
        this.loggedMappingErrors.add(errorKey);
        this.logger.error(
          `AllTimeAllPlayMatrixService: missing owner mapping in season ${seasonId} week ${weekNum} for "${teamName}"`
        );
      }
      return null;
    }

    return owner;
  }

  buildMatrix(): AllPlayMatrixResult | null {
    const ownerIndex = this.buildOwnerIndex();
    const ownerMeta = new Map(
      this.owners
        .allOwners()
        .map((o) => [o.managerName, (o.activeSeasons?.length ?? 0) || o.seasonsPlayed || 0] as const)
    );
    const seasonIds = this.weeklyMatchups.seasonIds();
    if (!seasonIds.length) return null;

    const weeklyScoresByOwner = new Map<string, Map<string, number>>();
    let weeksCount = 0;

    for (const seasonId of seasonIds) {
      const meta = this.leagueMeta.getSeasonMeta(seasonId);
      const season = this.weeklyMatchups.getSeasonWeeks(seasonId);
      if (!meta || !season) continue;

      for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
        const weekKey = `week${week}`;
        const weekData = season[weekKey];
        if (!weekData) continue;

        const ownerScores = new Map<string, number>();
        for (const entry of Object.values(weekData)) {
          const owner = this.resolveOwner(seasonId, week, entry.matchup?.team1Name, ownerIndex);
          const points = Number(entry.team1Totals?.totalPoints);
          if (!owner || !Number.isFinite(points)) continue;
          // One score per owner per week; first valid entry wins if duplicates appear.
          if (!ownerScores.has(owner)) ownerScores.set(owner, points);
        }

        if (ownerScores.size > 0) {
          weeklyScoresByOwner.set(`${seasonId}|${weekKey}`, ownerScores);
          weeksCount += 1;
        }
      }
    }

    if (weeksCount === 0) return null;

    const ownerNames = this.owners.allOwners().map((o) => o.managerName);
    const pairRecords = new Map<string, AllPlayPairRecord>();

    for (const rowOwner of ownerNames) {
      for (const colOwner of ownerNames) {
        if (rowOwner === colOwner) {
          pairRecords.set(`${rowOwner}|${colOwner}`, { wins: 0, losses: 0, ties: 0 });
          continue;
        }

        let wins = 0;
        let losses = 0;
        let ties = 0;
        for (const weekMap of weeklyScoresByOwner.values()) {
          const rowScore = weekMap.get(rowOwner);
          const colScore = weekMap.get(colOwner);
          if (rowScore == null || colScore == null) continue;

          const diff = rowScore - colScore;
          if (diff > EPSILON) wins += 1;
          else if (diff < -EPSILON) losses += 1;
          else ties += 1;
        }

        pairRecords.set(`${rowOwner}|${colOwner}`, { wins, losses, ties });
      }
    }

    const totalWins = new Map<string, number>();
    for (const owner of ownerNames) {
      let wins = 0;
      for (const other of ownerNames) {
        if (other === owner) continue;
        wins += pairRecords.get(`${owner}|${other}`)?.wins ?? 0;
      }
      totalWins.set(owner, wins);
    }

    const sortedOwners = [...ownerNames].sort(
      (a, b) => (totalWins.get(b) ?? 0) - (totalWins.get(a) ?? 0) || a.localeCompare(b)
    );

    const displayByOwner = new Map<string, string>();
    const ownerByDisplay = new Map<string, string>();
    for (const owner of sortedOwners) {
      const seasonsPlayed = ownerMeta.get(owner) ?? 0;
      const display = `${owner} (${seasonsPlayed})`;
      displayByOwner.set(owner, display);
      ownerByDisplay.set(display, owner);
    }

    const ownerFromDisplay = (display: string): string => ownerByDisplay.get(display) ?? display;

    const getRecord = (rowOwnerDisplay: string, colOwnerDisplay: string): AllPlayPairRecord => {
      const rowOwner = ownerFromDisplay(rowOwnerDisplay);
      const colOwner = ownerFromDisplay(colOwnerDisplay);
      return pairRecords.get(`${rowOwner}|${colOwner}`) ?? { wins: 0, losses: 0, ties: 0 };
    };

    const getTotalRecord = (ownerDisplay: string): AllPlayPairRecord => {
      const owner = ownerFromDisplay(ownerDisplay);
      let wins = 0;
      let losses = 0;
      let ties = 0;
      for (const other of ownerNames) {
        if (other === owner) continue;
        const r = pairRecords.get(`${owner}|${other}`) ?? { wins: 0, losses: 0, ties: 0 };
        wins += r.wins;
        losses += r.losses;
        ties += r.ties;
      }
      return { wins, losses, ties };
    };

    return {
      teamNames: sortedOwners.map((owner) => displayByOwner.get(owner) ?? owner),
      getRecord,
      getTotalRecord,
      weeksCount,
    };
  }
}
