import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { SubsectionHeader } from '../../../shared/components/subsection-header/subsection-header';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import {
  StarterGameList,
  StarterGameListItem,
} from '../../../shared/components/stat-card/stat-list/starter-game-list/starter-game-list';
import { StatValue } from '../../../shared/components/stat-card/stat-value/stat-value';
import { mapTeamNameShort } from '../../../shared/mappers/team-name-short.mapper';
import { SeasonStandingsService } from '../season-standings/season-standings.service';
import type { SeasonStandingsRow } from '../season-standings/season-standings.models';

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
  week: number;
}

interface TeamGameScore {
  teamName: string;
  points: number;
  week: number;
}

interface TeamGameDiff {
  teamName: string;
  opponentTeamName: string;
  points: number;
  week: number;
  diff: number;
}

interface StarterSingleWeekCarry {
  playerName: string;
  position: string;
  nflTeam: string;
  teamName: string;
  week: number;
  carryPct: number;
}

@Component({
  selector: 'app-season-awards',
  imports: [SubsectionHeader, StatCard, StarterGameList, StatValue],
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

  protected readonly topScoringStarterRows = computed<StarterGameListItem[]>(() =>
    this.topScoringStarters().map((starter) => ({
      value: starter.totalPoints,
      playerDetails: `${starter.playerName} (${starter.position} - ${starter.nflTeam})`,
      teamName: mapTeamNameShort(starter.teamName),
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
            week,
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

  protected readonly topSingleGameScoringStarterRows = computed<StarterGameListItem[]>(() =>
    this.topSingleGameScoringStarters().map((starter) => ({
      value: starter.points,
      weekLabel: String(starter.week).padStart(2, '0'),
      playerDetails: `${starter.playerName} (${starter.position} - ${starter.nflTeam})`,
      teamName: mapTeamNameShort(starter.teamName),
    }))
  );

  protected readonly topSingleGameScoringTeams = computed<TeamGameScore[]>(() => {
    const y = this.year();
    const meta = this.seasonMeta();
    if (y == null || !meta) return [];
    const gameScores: TeamGameScore[] = [];

    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(String(y), `week${week}`);
      if (!weekData) continue;

      const entries = Object.values(weekData);
      if (!entries.length) continue;

      for (const entry of entries) {
        const teamName = entry.matchup?.team1Name ?? 'Unknown Team';
        gameScores.push({
          teamName,
          points: Number(entry.team1Totals?.totalPoints ?? 0),
          week,
        });
      }
    }

    return gameScores
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.teamName.localeCompare(b.teamName);
      })
      .slice(0, 5);
  });

  protected readonly topSingleGameScoringTeamRows = computed<StarterGameListItem[]>(() =>
    this.topSingleGameScoringTeams().map((team) => ({
      value: team.points,
      weekLabel: String(team.week).padStart(2, '0'),
      teamName: mapTeamNameShort(team.teamName),
    }))
  );

  protected readonly topSingleGameLowestScoringTeams = computed<TeamGameScore[]>(() => {
    const y = this.year();
    const meta = this.seasonMeta();
    if (y == null || !meta) return [];
    const gameScores: TeamGameScore[] = [];

    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(String(y), `week${week}`);
      if (!weekData) continue;

      const entries = Object.values(weekData);
      if (!entries.length) continue;

      for (const entry of entries) {
        const teamName = entry.matchup?.team1Name ?? 'Unknown Team';
        gameScores.push({
          teamName,
          points: Number(entry.team1Totals?.totalPoints ?? 0),
          week,
        });
      }
    }

    return gameScores
      .sort((a, b) => {
        if (a.points !== b.points) return a.points - b.points;
        return a.teamName.localeCompare(b.teamName);
      })
      .slice(0, 5);
  });

  protected readonly topSingleGameLowestScoringTeamRows = computed<StarterGameListItem[]>(() =>
    this.topSingleGameLowestScoringTeams().map((team) => ({
      value: team.points,
      weekLabel: String(team.week).padStart(2, '0'),
      teamName: mapTeamNameShort(team.teamName),
    }))
  );

  protected readonly topSingleGameBiggestLosers = computed<TeamGameDiff[]>(() => {
    const y = this.year();
    const meta = this.seasonMeta();
    if (y == null || !meta) return [];
    const gameDiffs: TeamGameDiff[] = [];

    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(String(y), `week${week}`);
      if (!weekData) continue;

      const entries = Object.values(weekData);
      if (!entries.length) continue;

      for (const entry of entries) {
        const teamName = entry.matchup?.team1Name ?? 'Unknown Team';
        const opponentTeamName = entry.matchup?.team2Name ?? 'Unknown Team';
        const teamPoints = Number(entry.team1Totals?.totalPoints ?? 0);
        const opponentPoints = Number(entry.matchup?.team2Score ?? 0);
        const diff = teamPoints - opponentPoints;

        if (diff >= 0) continue;

        gameDiffs.push({
          teamName,
          opponentTeamName,
          points: teamPoints,
          week,
          diff,
        });
      }
    }

    return gameDiffs
      .sort((a, b) => {
        if (a.diff !== b.diff) return a.diff - b.diff;
        return a.teamName.localeCompare(b.teamName);
      })
      .slice(0, 5);
  });

  protected readonly topSingleGameBiggestLoserRows = computed<StarterGameListItem[]>(() =>
    this.topSingleGameBiggestLosers().map((team) => ({
      value: team.points,
      weekLabel: String(team.week).padStart(2, '0'),
      teamName: mapTeamNameShort(team.teamName),
    }))
  );

  protected readonly topSingleGameNarrowestVictories = computed<TeamGameDiff[]>(() => {
    const y = this.year();
    const meta = this.seasonMeta();
    if (y == null || !meta) return [];
    const gameDiffs: TeamGameDiff[] = [];

    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(String(y), `week${week}`);
      if (!weekData) continue;

      const entries = Object.values(weekData);
      if (!entries.length) continue;

      for (const entry of entries) {
        const teamName = entry.matchup?.team1Name ?? 'Unknown Team';
        const opponentTeamName = entry.matchup?.team2Name ?? 'Unknown Team';
        const teamPoints = Number(entry.team1Totals?.totalPoints ?? 0);
        const opponentPoints = Number(entry.matchup?.team2Score ?? 0);
        const diff = teamPoints - opponentPoints;

        if (diff <= 0) continue;

        gameDiffs.push({
          teamName,
          opponentTeamName,
          points: teamPoints,
          week,
          diff,
        });
      }
    }

    return gameDiffs
      .sort((a, b) => {
        if (a.diff !== b.diff) return a.diff - b.diff;
        return a.teamName.localeCompare(b.teamName);
      })
      .slice(0, 5);
  });

  protected readonly topSingleGameNarrowestVictoryRows = computed<StarterGameListItem[]>(() =>
    this.topSingleGameNarrowestVictories().map((team) => ({
      value: team.points,
      weekLabel: String(team.week).padStart(2, '0'),
      teamName: mapTeamNameShort(team.teamName),
    }))
  );

  protected readonly topSingleWeekCarryStarters = computed<StarterSingleWeekCarry[]>(() => {
    const y = this.year();
    const meta = this.seasonMeta();
    if (y == null || !meta) return [];

    const carryRows: StarterSingleWeekCarry[] = [];

    for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
      const weekData = this.weeklyMatchupsData.getMatchupsForWeek(String(y), `week${week}`);
      if (!weekData) continue;

      const entries = Object.values(weekData);
      if (!entries.length) continue;

      for (const entry of entries) {
        const teamName = entry.matchup?.team1Name ?? 'Unknown Team';
        const teamPoints = Number(entry.team1Totals?.totalPoints ?? 0);
        if (teamPoints <= 0) continue;

        const roster = entry.team1Roster ?? [];
        for (const player of roster) {
          if (player.slot !== 'starter') continue;

          carryRows.push({
            playerName: player.playerName,
            position: player.position,
            nflTeam: player.nflTeam,
            teamName,
            week,
            carryPct: (Number(player.points ?? 0) / teamPoints) * 100,
          });
        }
      }
    }

    return carryRows
      .sort((a, b) => {
        if (b.carryPct !== a.carryPct) return b.carryPct - a.carryPct;
        return a.playerName.localeCompare(b.playerName);
      })
      .slice(0, 5);
  });

  protected readonly topSingleWeekCarryStarterRows = computed<StarterGameListItem[]>(() =>
    this.topSingleWeekCarryStarters().map((starter) => ({
      value: `${starter.carryPct.toFixed(1)}%`,
      weekLabel: String(starter.week).padStart(2, '0'),
      playerDetails: `${starter.playerName} (${starter.position} - ${starter.nflTeam})`,
      teamName: mapTeamNameShort(starter.teamName),
    }))
  );
}
