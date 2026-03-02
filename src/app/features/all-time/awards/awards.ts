import { Component, computed, inject } from '@angular/core';
import { LoggerService } from '@ankur-1980/logger';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { OwnersDataService } from '../../../data/owners-data.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { AllTimeRecordsService } from '../records/records.service';
import {
  StatListV3Component,
  type StatListV3Row,
} from '../../../shared/components/stat-card/stat-list-v3/stat-list-v3.component';

interface SeasonTeamPointsRow {
  points: number;
  year: string;
  ownerName: string;
}

interface SingleGamePointsRow {
  points: number;
  year: string;
  ownerName: string;
  week: number;
}

interface SingleGameMarginRow {
  margin: number;
  year: string;
  ownerName: string;
  week: number;
}

interface SeasonWinsRow {
  wins: number;
  year: string;
  ownerName: string;
}

interface AverageWinsPerSeasonRow {
  avgWins: number;
  ownerName: string;
  seasonsPlayed: number;
}

interface AveragePointsPerSeasonRow {
  avgPointsPerSeason: number;
  ownerName: string;
  seasonsPlayed: number;
}

interface ChampionshipRow {
  championships: number;
  ownerName: string;
}

interface HighPointsChampionshipRow {
  year: string;
  ownerName: string;
}

interface RunnerUpRow {
  ownerName: string;
  count: number;
}

function normalize(value: string | null | undefined): string {
  return value != null ? String(value).trim().toLowerCase() : '';
}
const EPSILON = 0.000001;

@Component({
  selector: 'app-awards',
  imports: [StatCard, StatListV3Component],
  templateUrl: './awards.html',
  styleUrl: './awards.scss',
})
export class Awards {
  private readonly leagueMetaData = inject(LeagueMetaDataService);
  private readonly ownersData = inject(OwnersDataService);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly weeklyMatchupsData = inject(WeeklyMatchupsDataService);
  private readonly allTimeRecords = inject(AllTimeRecordsService);
  private readonly logger = inject(LoggerService);
  private readonly allTimeRecordRows = computed(() => this.allTimeRecords.toTableState().data);
  private readonly loggedOwnerMappingErrors = new Set<string>();

  private readonly ownerLookup = computed(() => {
    const ownerMap = new Map<string, string>();
    const ambiguous = new Set<string>();

    for (const owner of this.ownersData.allOwners()) {
      for (const teamName of owner.teamNames ?? []) {
        const key = normalize(teamName);
        if (!key || ambiguous.has(key)) continue;

        const existing = ownerMap.get(key);
        if (existing && existing !== owner.managerName) {
          ownerMap.delete(key);
          ambiguous.add(key);
          continue;
        }

        ownerMap.set(key, owner.managerName);
      }
    }

    return { ownerMap, ambiguous };
  });

  private resolveOwnerFromTeamName(
    teamName: string | null | undefined,
    context: string,
    seasonId: string,
    week: number,
  ): string | null {
    const key = normalize(teamName);
    if (!key) {
      const errorKey = `${seasonId}|${week}|${context}|missing-team`;
      if (!this.loggedOwnerMappingErrors.has(errorKey)) {
        this.loggedOwnerMappingErrors.add(errorKey);
        this.logger.error(
          `AllTimeAwards: skipped ${context} in ${seasonId} week ${week}; missing team name`,
        );
      }
      return null;
    }

    const { ownerMap, ambiguous } = this.ownerLookup();
    if (ambiguous.has(key)) {
      const errorKey = `${seasonId}|${week}|${context}|ambiguous|${key}`;
      if (!this.loggedOwnerMappingErrors.has(errorKey)) {
        this.loggedOwnerMappingErrors.add(errorKey);
        this.logger.error(
          `AllTimeAwards: skipped ${context} in ${seasonId} week ${week}; ambiguous team name "${teamName}"`,
        );
      }
      return null;
    }

    const ownerName = ownerMap.get(key);
    if (!ownerName) {
      const errorKey = `${seasonId}|${week}|${context}|missing-owner|${key}`;
      if (!this.loggedOwnerMappingErrors.has(errorKey)) {
        this.loggedOwnerMappingErrors.add(errorKey);
        this.logger.error(
          `AllTimeAwards: skipped ${context} in ${seasonId} week ${week}; no owner found for "${teamName}"`,
        );
      }
      return null;
    }

    return ownerName;
  }

  private readonly seasonPointsRows = computed<SeasonTeamPointsRow[]>(() => {
    const rows: SeasonTeamPointsRow[] = [];

    for (const seasonId of this.seasonStandingsData.seasonIds()) {
      const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
      if (!standings) continue;

      for (const entry of Object.values(standings)) {
        rows.push({
          points: entry.points?.pointsFor ?? 0,
          year: seasonId,
          ownerName: entry.playerDetails?.managerName ?? 'Unknown Owner',
        });
      }
    }

    return rows;
  });

  protected readonly topSeasonHighPoints = computed<SeasonTeamPointsRow[]>(() =>
    [...this.seasonPointsRows()]
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.year !== a.year) return Number(b.year) - Number(a.year);
        return a.ownerName.localeCompare(b.ownerName);
      })
      .slice(0, 10),
  );

  protected readonly topSeasonLowPoints = computed<SeasonTeamPointsRow[]>(() =>
    [...this.seasonPointsRows()]
      .sort((a, b) => {
        if (a.points !== b.points) return a.points - b.points;
        if (b.year !== a.year) return Number(b.year) - Number(a.year);
        return a.ownerName.localeCompare(b.ownerName);
      })
      .slice(0, 10),
  );

  protected readonly topSeasonHighPointsRows = computed<StatListV3Row[]>(() =>
    this.topSeasonHighPoints().map((row) => ({
      id: `season-high|${row.year}|${row.ownerName}|${row.points.toFixed(2)}`,
      value: row.points,
      primary: row.ownerName,
      meta1: row.year,
    })),
  );

  protected readonly topSeasonLowPointsRows = computed<StatListV3Row[]>(() =>
    this.topSeasonLowPoints().map((row) => ({
      id: `season-low|${row.year}|${row.ownerName}|${row.points.toFixed(2)}`,
      value: row.points,
      primary: row.ownerName,
      meta1: row.year,
    })),
  );

  private readonly allSingleGamePoints = computed<SingleGamePointsRow[]>(() => {
    const rows: SingleGamePointsRow[] = [];

    for (const seasonId of this.weeklyMatchupsData.seasonIds()) {
      const meta = this.leagueMetaData.getSeasonMeta(seasonId);
      if (!meta) continue;

      for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
        const weekData = this.weeklyMatchupsData.getMatchupsForWeek(seasonId, `week${week}`);
        if (!weekData) continue;

        for (const entry of Object.values(weekData)) {
          const teamName = entry.matchup?.team1Name ?? '';
          const ownerName = this.resolveOwnerFromTeamName(
            teamName,
            'single-game points',
            seasonId,
            week,
          );
          if (!ownerName) continue;
          const points = Number(entry.team1Totals?.totalPoints ?? 0);
          if (!Number.isFinite(points)) continue;

          rows.push({
            points,
            year: seasonId,
            ownerName,
            week,
          });
        }
      }
    }

    return rows;
  });

  protected readonly topSingleGameHighPoints = computed<SingleGamePointsRow[]>(() =>
    [...this.allSingleGamePoints()]
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.year !== a.year) return Number(b.year) - Number(a.year);
        if (b.week !== a.week) return b.week - a.week;
        return a.ownerName.localeCompare(b.ownerName);
      })
      .slice(0, 10),
  );

  protected readonly topSingleGameLowPoints = computed<SingleGamePointsRow[]>(() =>
    [...this.allSingleGamePoints()]
      .sort((a, b) => {
        if (a.points !== b.points) return a.points - b.points;
        if (b.year !== a.year) return Number(b.year) - Number(a.year);
        if (a.week !== b.week) return a.week - b.week;
        return a.ownerName.localeCompare(b.ownerName);
      })
      .slice(0, 10),
  );

  protected readonly topSingleGameHighPointsRows = computed<StatListV3Row[]>(() =>
    this.topSingleGameHighPoints().map((row) => ({
      id: `game-high|${row.year}|${row.week}|${row.ownerName}|${row.points.toFixed(2)}`,
      value: row.points,
      primary: row.ownerName,
      meta1: `Week ${String(row.week).padStart(2, '0')}`,
      meta2: row.year,
    })),
  );

  protected readonly topSingleGameLowPointsRows = computed<StatListV3Row[]>(() =>
    this.topSingleGameLowPoints().map((row) => ({
      id: `game-low|${row.year}|${row.week}|${row.ownerName}|${row.points.toFixed(2)}`,
      value: row.points,
      primary: row.ownerName,
      meta1: `Week ${String(row.week).padStart(2, '0')}`,
      meta2: row.year,
    })),
  );

  private readonly allSingleGameMargins = computed<SingleGameMarginRow[]>(() => {
    const rows: SingleGameMarginRow[] = [];

    for (const seasonId of this.weeklyMatchupsData.seasonIds()) {
      const meta = this.leagueMetaData.getSeasonMeta(seasonId);
      if (!meta) continue;

      for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
        const weekData = this.weeklyMatchupsData.getMatchupsForWeek(seasonId, `week${week}`);
        if (!weekData) continue;

        for (const entry of Object.values(weekData)) {
          const teamName = entry.matchup?.team1Name ?? '';
          const ownerName = this.resolveOwnerFromTeamName(
            teamName,
            'single-game margin',
            seasonId,
            week,
          );
          if (!ownerName) continue;
          const teamScore = Number(entry.matchup?.team1Score ?? 0);
          const opponentScore = Number(entry.matchup?.team2Score ?? 0);
          if (!Number.isFinite(teamScore) || !Number.isFinite(opponentScore)) continue;

          const margin = teamScore - opponentScore;
          if (margin <= 0) continue;

          rows.push({
            margin,
            year: seasonId,
            ownerName,
            week,
          });
        }
      }
    }

    return rows.filter((row) => row.margin > 0);
  });

  protected readonly topSingleGameMargins = computed<SingleGameMarginRow[]>(() =>
    [...this.allSingleGameMargins()]
      .sort((a, b) => {
        if (b.margin !== a.margin) return b.margin - a.margin;
        if (b.year !== a.year) return Number(b.year) - Number(a.year);
        if (b.week !== a.week) return b.week - a.week;
        return a.ownerName.localeCompare(b.ownerName);
      })
      .slice(0, 10),
  );

  protected readonly topSingleGameMarginsRows = computed<StatListV3Row[]>(() =>
    this.topSingleGameMargins().map((row) => ({
      id: `margin-high|${row.year}|${row.week}|${row.ownerName}|${row.margin.toFixed(2)}`,
      value: row.margin,
      primary: row.ownerName,
      meta1: `Week ${String(row.week).padStart(2, '0')}`,
      meta2: row.year,
    })),
  );

  protected readonly topSingleGameNarrowestVictories = computed<SingleGameMarginRow[]>(() =>
    [...this.allSingleGameMargins()]
      .sort((a, b) => {
        if (a.margin !== b.margin) return a.margin - b.margin;
        if (b.year !== a.year) return Number(b.year) - Number(a.year);
        if (b.week !== a.week) return b.week - a.week;
        return a.ownerName.localeCompare(b.ownerName);
      })
      .slice(0, 10),
  );

  protected readonly topSingleGameNarrowestVictoriesRows = computed<StatListV3Row[]>(() =>
    this.topSingleGameNarrowestVictories().map((row) => ({
      id: `margin-low|${row.year}|${row.week}|${row.ownerName}|${row.margin.toFixed(2)}`,
      value: row.margin,
      primary: row.ownerName,
      meta1: `Week ${String(row.week).padStart(2, '0')}`,
      meta2: row.year,
    })),
  );

  private readonly seasonWinsRows = computed<SeasonWinsRow[]>(() => {
    const rows: SeasonWinsRow[] = [];

    for (const seasonId of this.seasonStandingsData.seasonIds()) {
      const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
      if (!standings) continue;

      for (const entry of Object.values(standings)) {
        rows.push({
          wins: Number(entry.record?.win ?? 0),
          year: seasonId,
          ownerName: entry.playerDetails?.managerName ?? 'Unknown Owner',
        });
      }
    }

    return rows;
  });

  protected readonly fewestSeasonWinsMaxThree = computed<SeasonWinsRow[]>(() =>
    this.seasonWinsRows()
      .filter((row) => row.wins <= 3)
      .sort((a, b) => {
        if (a.wins !== b.wins) return a.wins - b.wins;
        if (b.year !== a.year) return Number(b.year) - Number(a.year);
        return a.ownerName.localeCompare(b.ownerName);
      }),
  );

  protected readonly fewestSeasonWinsMaxThreeRows = computed<StatListV3Row[]>(() =>
    this.fewestSeasonWinsMaxThree().map((row) => ({
      id: `fewest-wins|${row.year}|${row.ownerName}|${row.wins}`,
      value: row.wins,
      primary: row.ownerName,
      meta1: row.year,
    })),
  );

  protected readonly mostSeasonWinsMaxTwelve = computed<SeasonWinsRow[]>(() =>
    this.seasonWinsRows()
      .filter((row) => row.wins >= 12)
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.year !== a.year) return Number(b.year) - Number(a.year);
        return a.ownerName.localeCompare(b.ownerName);
      }),
  );

  protected readonly mostSeasonWinsMaxTwelveRows = computed<StatListV3Row[]>(() =>
    this.mostSeasonWinsMaxTwelve().map((row) => ({
      id: `most-wins|${row.year}|${row.ownerName}|${row.wins}`,
      value: row.wins,
      primary: row.ownerName,
      meta1: row.year,
    })),
  );

  private readonly averageWinsPerSeasonRows = computed<AverageWinsPerSeasonRow[]>(() =>
    this.allTimeRecordRows()
      .map((row) => ({
        avgWins: row.totalSeasons > 0 ? row.wins / row.totalSeasons : 0,
        ownerName: row.ownerName,
        seasonsPlayed: row.totalSeasons,
      }))
      .filter((row) => row.seasonsPlayed > 0),
  );

  protected readonly averageWinsPerSeasonListRows = computed<StatListV3Row[]>(() =>
    this.averageWinsPerSeasonRows()
      .sort((a, b) => {
        if (b.avgWins !== a.avgWins) return b.avgWins - a.avgWins;
        if (b.seasonsPlayed !== a.seasonsPlayed) return b.seasonsPlayed - a.seasonsPlayed;
        return a.ownerName.localeCompare(b.ownerName);
      })
      .map((row) => ({
        id: `avg-wins|${row.ownerName}|${row.seasonsPlayed}|${row.avgWins.toFixed(4)}`,
        value: row.avgWins,
        primary: row.ownerName,
        meta1: `${row.seasonsPlayed}`,
      })),
  );

  protected readonly topAveragePointsPerSeasonRows = computed<StatListV3Row[]>(() =>
    this.allTimeRecordRows()
      .map(
        (row): AveragePointsPerSeasonRow => ({
          avgPointsPerSeason: row.avgPointsPerSeason,
          ownerName: row.ownerName,
          seasonsPlayed: row.totalSeasons,
        }),
      )
      .filter((row) => row.seasonsPlayed > 0)
      .sort((a, b) => {
        if (b.avgPointsPerSeason !== a.avgPointsPerSeason) {
          return b.avgPointsPerSeason - a.avgPointsPerSeason;
        }
        if (b.seasonsPlayed !== a.seasonsPlayed) return b.seasonsPlayed - a.seasonsPlayed;
        return a.ownerName.localeCompare(b.ownerName);
      })
      .slice(0, 5)
      .map((row) => ({
        id: `avg-points|${row.ownerName}|${row.seasonsPlayed}|${row.avgPointsPerSeason.toFixed(4)}`,
        value: row.avgPointsPerSeason,
        primary: row.ownerName,
        meta1: `${row.seasonsPlayed} seasons`,
      })),
  );

  protected readonly mostChampionshipsRows = computed<StatListV3Row[]>(() =>
    this.allTimeRecordRows()
      .map(
        (row): ChampionshipRow => ({
          championships: row.championships,
          ownerName: row.ownerName,
        }),
      )
      .filter((row) => row.championships >= 1)
      .sort((a, b) => {
        if (b.championships !== a.championships) return b.championships - a.championships;
        return a.ownerName.localeCompare(b.ownerName);
      })
      .map((row) => ({
        id: `championships|${row.ownerName}|${row.championships}`,
        value: row.championships,
        primary: row.ownerName,
      })),
  );

  protected readonly starterSingleGameRows = computed<StatListV3Row[]>(() =>
    this.allTimeRecords.getTopStarterSingleGameRecords().map((row) => ({
      id: `starter-game|${row.year}|${row.week}|${row.ownerName}|${row.playerName}|${row.points.toFixed(2)}`,
      value: row.points,
      primary: row.playerName,
      meta1: `${row.year}/Week ${String(row.week).padStart(2, '0')}`,
      meta2: row.ownerName,
    })),
  );

  protected readonly starterSeasonRows = computed<StatListV3Row[]>(() =>
    this.allTimeRecords.getTopStarterSeasonRecords().map((row) => ({
      id: `starter-season|${row.year}|${row.ownerName}|${row.playerName}|${row.points.toFixed(2)}`,
      value: row.points,
      primary: row.playerName,
      meta1: `${row.year}`,
      meta2: row.ownerName,
    })),
  );

  protected readonly highPointsAndChampionshipRows = computed<StatListV3Row[]>(() => {
    const rows: HighPointsChampionshipRow[] = [];

    for (const seasonId of this.seasonStandingsData.seasonIds()) {
      const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
      if (!standings) continue;

      const entries = Object.values(standings);
      if (!entries.length) continue;

      const topPoints = Math.max(...entries.map((entry) => entry.points?.pointsFor ?? 0));
      const winners = entries.filter((entry) => {
        const isSeasonHighPoints = Math.abs((entry.points?.pointsFor ?? 0) - topPoints) < EPSILON;
        const playoffRank = Number.parseInt(String(entry.ranks?.playoffRank ?? '').trim(), 10);
        const isChampion = Number.isFinite(playoffRank) && playoffRank === 1;
        return isSeasonHighPoints && isChampion;
      });

      for (const winner of winners) {
        const ownerName = winner.playerDetails?.managerName ?? 'Unknown Owner';
        rows.push({
          year: seasonId,
          ownerName,
        });
      }
    }

    return rows
      .sort((a, b) => {
        if (a.year !== b.year) return Number(a.year) - Number(b.year);
        return a.ownerName.localeCompare(b.ownerName);
      })
      .map((row) => ({
        id: `high-and-champ|${row.year}|${row.ownerName}`,
        value: row.year,
        primary: row.ownerName,
      }));
  });

  protected readonly mostRunnerUpFinishesRows = computed<StatListV3Row[]>(() => {
    const countsByOwner = new Map<string, number>();

    for (const seasonId of this.seasonStandingsData.seasonIds()) {
      const standings = this.seasonStandingsData.getStandingsForSeason(seasonId);
      if (!standings) continue;

      for (const entry of Object.values(standings)) {
        const playoffRank = Number.parseInt(String(entry.ranks?.playoffRank ?? '').trim(), 10);
        if (!Number.isFinite(playoffRank) || playoffRank !== 2) continue;

        const ownerName = entry.playerDetails?.managerName ?? 'Unknown Owner';
        countsByOwner.set(ownerName, (countsByOwner.get(ownerName) ?? 0) + 1);
      }
    }

    return Array.from(countsByOwner.entries())
      .map(
        ([ownerName, count]): RunnerUpRow => ({
          ownerName,
          count,
        }),
      )
      .filter((row) => row.count >= 1)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.ownerName.localeCompare(b.ownerName);
      })
      .map((row) => ({
        id: `runner-up|${row.ownerName}|${row.count}`,
        value: row.count,
        primary: row.ownerName,
      }));
  });
}
