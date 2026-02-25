import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { SubsectionHeader } from '../../../shared/components/subsection-header/subsection-header';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { StatList, StatListItem } from '../../../shared/components/stat-card/stat-list/stat-list';
import { StatValue } from '../../../shared/components/stat-card/stat-value/stat-value';
import {
  SeasonStandingsRow,
  SeasonStandingsService,
} from '../season-standings/season-standings.service';

interface BestRecordAward {
  record: string;
  winPct: string;
  footer: string;
}

interface NumericAward {
  value: string;
  footer: string;
}

interface CountAward {
  value: string;
  footer: string;
}

interface StarterSeasonTotal {
  playerName: string;
  position: string;
  nflTeam: string;
  teamName: string;
  totalPoints: number;
}

interface StarterGameScore {
  playerName: string;
  position: string;
  nflTeam: string;
  teamName: string;
  points: number;
}

@Component({
  selector: 'app-season-awards',
  imports: [SubsectionHeader, StatCard, StatList, StatValue],
  templateUrl: './season-awards.html',
  styleUrl: './season-awards.scss',
})
export class SeasonAwards {
  private readonly route = inject(ActivatedRoute);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly weeklyMatchupsData = inject(WeeklyMatchupsDataService);
  private readonly leagueMetaData = inject(LeagueMetaDataService);
  private readonly seasonStandings = inject(SeasonStandingsService);

  private readonly year = toSignal(
    (this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null))
    ),
    { initialValue: null }
  );

  private readonly standings = computed(() => {
    const y = this.year();
    if (y == null) return null;
    return this.seasonStandingsData.getStandingsForSeason(String(y));
  });

  private readonly seasonMeta = computed(() => {
    const y = this.year();
    if (y == null) return null;
    return this.leagueMetaData.getSeasonMeta(String(y));
  });

  private readonly rows = computed(() =>
    this.seasonStandings.toTableState(this.standings()).data
  );

  private buildFooter(rows: SeasonStandingsRow[]): string {
    return rows.map((row) => `${row.teamName} - ${row.managerName}`).join(' | ');
  }

  private formatHighPointsTotal(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  }

  protected readonly bestRecordAward = computed<BestRecordAward | null>(() => {
    const rows = this.rows();
    if (!rows.length) return null;

    const topWinPct = Math.max(...rows.map((row) => row.winPct));
    const tiedRows = rows.filter((row) => Math.abs(row.winPct - topWinPct) < 0.000001);

    const displayRow = tiedRows.reduce((currentBest, row) => {
      if (row.win !== currentBest.win) {
        return row.win > currentBest.win ? row : currentBest;
      }
      return row.pointsFor > currentBest.pointsFor ? row : currentBest;
    });

    const record =
      displayRow.tie > 0
        ? `${displayRow.win}-${displayRow.loss}-${displayRow.tie}`
        : `${displayRow.win}-${displayRow.loss}`;

    const footer = tiedRows
      .map((row) => `${row.teamName} - ${row.managerName}`)
      .join(' | ');

    return {
      record,
      winPct: `${topWinPct.toFixed(2)}%`,
      footer,
    };
  });

  protected readonly seasonHighPointsAward = computed<NumericAward | null>(() => {
    const rows = this.rows();
    if (!rows.length) return null;

    const topPointsFor = Math.max(...rows.map((row) => row.pointsFor));
    const tiedRows = rows.filter(
      (row) => Math.abs(row.pointsFor - topPointsFor) < 0.000001
    );

    return {
      value: topPointsFor.toFixed(2),
      footer: this.buildFooter(tiedRows),
    };
  });

  protected readonly bestPointsDiffAward = computed<NumericAward | null>(() => {
    const rows = this.rows();
    if (!rows.length) return null;

    const topDiff = Math.max(...rows.map((row) => row.diff));
    const tiedRows = rows.filter((row) => Math.abs(row.diff - topDiff) < 0.000001);

    return {
      value: topDiff.toFixed(2),
      footer: this.buildFooter(tiedRows),
    };
  });

  protected readonly fewestPointsAgainstAward = computed<NumericAward | null>(() => {
    const rows = this.rows();
    if (!rows.length) return null;

    const lowestPointsAgainst = Math.min(...rows.map((row) => row.pointsAgainst));
    const tiedRows = rows.filter(
      (row) => Math.abs(row.pointsAgainst - lowestPointsAgainst) < 0.000001
    );

    return {
      value: lowestPointsAgainst.toFixed(2),
      footer: this.buildFooter(tiedRows),
    };
  });

  protected readonly mostRegularSeasonHighPointsAward = computed<CountAward | null>(() => {
    const y = this.year();
    const rows = this.rows();
    const meta = this.seasonMeta();
    if (y == null || !rows.length || !meta) return null;

    const weeklyHighPointCounts = new Map<string, number>();

    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(String(y), `week${week}`);
      if (!weekData) continue;

      const entries = Object.values(weekData);
      if (!entries.length) continue;

      const topScore = Math.max(
        ...entries.map((entry) => entry.team1Totals?.totalPoints ?? Number.NEGATIVE_INFINITY)
      );
      const weeklyHighPointWinners = entries.filter(
        (entry) =>
          Math.abs((entry.team1Totals?.totalPoints ?? Number.NEGATIVE_INFINITY) - topScore) <
          0.000001
      );

      for (const winner of weeklyHighPointWinners) {
        const teamName = winner.matchup?.team1Name;
        if (!teamName) continue;
        weeklyHighPointCounts.set(teamName, (weeklyHighPointCounts.get(teamName) ?? 0) + 1);
      }
    }

    // If weekly historical matchup data is not available for this season,
    // fall back to the precomputed regular-season highPoints totals in standings data.
    if (!weeklyHighPointCounts.size) {
      const standings = this.standings();
      if (!standings) return null;

      const entries = Object.values(standings);
      if (!entries.length) return null;

      const topHighPoints = Math.max(
        ...entries.map((entry) => entry.points?.highPoints ?? Number.NEGATIVE_INFINITY)
      );
      const winners = entries.filter(
        (entry) =>
          Math.abs((entry.points?.highPoints ?? Number.NEGATIVE_INFINITY) - topHighPoints) <
          0.000001
      );
      if (!winners.length) return null;

      const footer = winners
        .map(
          (winner) =>
            `${winner.playerDetails?.teamName ?? 'Unknown Team'} - ${winner.playerDetails?.managerName ?? ''}`
        )
        .join(' | ');

      return {
        value: this.formatHighPointsTotal(topHighPoints),
        footer,
      };
    }

    const topCount = Math.max(...weeklyHighPointCounts.values());
    const winners = rows.filter(
      (row) => (weeklyHighPointCounts.get(row.teamName) ?? 0) === topCount
    );

    if (!winners.length) return null;

    const footer = winners
      .map((winner) => `${winner.teamName} - ${winner.managerName}`)
      .join(' | ');

    return {
      value: `${topCount}`,
      footer,
    };
  });

  protected readonly mostRegularSeasonLowPointsAward = computed<CountAward | null>(() => {
    const y = this.year();
    const rows = this.rows();
    const meta = this.seasonMeta();
    if (y == null || !rows.length || !meta) return null;

    const weeklyLowPointCounts = new Map<string, number>();

    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(String(y), `week${week}`);
      if (!weekData) continue;

      const entries = Object.values(weekData);
      if (!entries.length) continue;

      const lowScore = Math.min(
        ...entries.map((entry) => entry.team1Totals?.totalPoints ?? Number.POSITIVE_INFINITY)
      );
      const weeklyLowPointWinners = entries.filter(
        (entry) =>
          Math.abs((entry.team1Totals?.totalPoints ?? Number.POSITIVE_INFINITY) - lowScore) <
          0.000001
      );

      for (const winner of weeklyLowPointWinners) {
        const teamName = winner.matchup?.team1Name;
        if (!teamName) continue;
        weeklyLowPointCounts.set(teamName, (weeklyLowPointCounts.get(teamName) ?? 0) + 1);
      }
    }

    // Do not show this award when weekly matchup history is unavailable.
    if (!weeklyLowPointCounts.size) return null;

    const topCount = Math.max(...weeklyLowPointCounts.values());
    const winners = rows.filter(
      (row) => (weeklyLowPointCounts.get(row.teamName) ?? 0) === topCount
    );
    if (!winners.length) return null;

    const footer = winners
      .map((winner) => `${winner.teamName} - ${winner.managerName}`)
      .join(' | ');

    return {
      value: `${topCount}`,
      footer,
    };
  });

  protected readonly mostMovesAward = computed<CountAward | null>(() => {
    const y = this.year();
    const meta = this.seasonMeta();
    const rows = this.rows();
    if (y == null || !meta || !rows.length) return null;

    let hasHistoricalMatchupData = false;
    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(String(y), `week${week}`);
      if (weekData && Object.keys(weekData).length > 0) {
        hasHistoricalMatchupData = true;
        break;
      }
    }

    if (!hasHistoricalMatchupData) return null;

    const topMoves = Math.max(...rows.map((row) => row.moves));
    const winners = rows.filter((row) => row.moves === topMoves);
    if (!winners.length) return null;

    return {
      value: `${topMoves}`,
      footer: this.buildFooter(winners),
    };
  });

  protected readonly mostTradesAward = computed<CountAward | null>(() => {
    const rows = this.rows();
    if (!rows.length) return null;

    const eligibleRows = rows.filter((row) => row.trades >= 2);
    if (!eligibleRows.length) return null;

    const topTrades = Math.max(...eligibleRows.map((row) => row.trades));
    const winners = eligibleRows.filter((row) => row.trades === topTrades);
    if (!winners.length) return null;

    return {
      value: `${topTrades}`,
      footer: this.buildFooter(winners),
    };
  });

  protected readonly topScoringStarters = computed<StarterSeasonTotal[]>(() => {
    const y = this.year();
    const meta = this.seasonMeta();
    if (y == null || !meta) return [];

    const totals = new Map<string, StarterSeasonTotal>();
    let hasWeeklyData = false;

    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(String(y), `week${week}`);
      if (!weekData) continue;

      const entries = Object.values(weekData);
      if (!entries.length) continue;
      hasWeeklyData = true;

      for (const entry of entries) {
        const roster = entry.team1Roster ?? [];
        const teamName = entry.matchup?.team1Name ?? 'Unknown Team';
        for (const player of roster) {
          if (player.slot !== 'starter') continue;

          const key =
            player.playerId && String(player.playerId).trim() !== ''
              ? `id:${player.playerId}|team:${teamName}`
              : `name:${player.playerName}|${player.nflTeam}|team:${teamName}`;
          const existing = totals.get(key);

          if (existing) {
            existing.totalPoints += Number(player.points ?? 0);
          } else {
            totals.set(key, {
              playerName: player.playerName,
              position: player.position,
              nflTeam: player.nflTeam,
              teamName,
              totalPoints: Number(player.points ?? 0),
            });
          }
        }
      }
    }

    if (!hasWeeklyData) return [];

    return Array.from(totals.values())
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.playerName.localeCompare(b.playerName);
      })
      .slice(0, 5);
  });

  protected readonly topScoringStarterItems = computed<StatListItem[]>(() =>
    this.topScoringStarters().map((starter) => ({
      label: `${starter.playerName} (${starter.position} - ${starter.nflTeam}) - ${starter.teamName}`,
      value: starter.totalPoints.toFixed(2),
    }))
  );

  protected readonly topSingleGameScoringStarters = computed<StarterGameScore[]>(() => {
    const y = this.year();
    const meta = this.seasonMeta();
    if (y == null || !meta) return [];

    const gameScores: StarterGameScore[] = [];

    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(String(y), `week${week}`);
      if (!weekData) continue;

      const entries = Object.values(weekData);
      if (!entries.length) continue;

      for (const entry of entries) {
        const roster = entry.team1Roster ?? [];
        const teamName = entry.matchup?.team1Name ?? 'Unknown Team';

        for (const player of roster) {
          if (player.slot !== 'starter') continue;

          gameScores.push({
            playerName: player.playerName,
            position: player.position,
            nflTeam: player.nflTeam,
            teamName,
            points: Number(player.points ?? 0),
          });
        }
      }
    }

    return gameScores
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.playerName.localeCompare(b.playerName);
      })
      .slice(0, 5);
  });

  protected readonly topSingleGameScoringStarterItems = computed<StatListItem[]>(() =>
    this.topSingleGameScoringStarters().map((starter) => ({
      label: `${starter.playerName} (${starter.position} - ${starter.nflTeam}) - ${starter.teamName}`,
      value: starter.points.toFixed(2),
    }))
  );
}
