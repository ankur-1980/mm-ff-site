import { Component, computed, inject } from '@angular/core';

import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { OwnersDataService } from '../../../data/owners-data.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import {
  StarterGameList,
  StarterGameListItem,
} from '../../../shared/components/stat-card/stat-list/starter-game-list/starter-game-list';

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

function normalize(value: string | null | undefined): string {
  return value != null ? String(value).trim().toLowerCase() : '';
}

@Component({
  selector: 'app-awards',
  imports: [StatCard, StarterGameList],
  templateUrl: './awards.html',
  styleUrl: './awards.scss',
})
export class Awards {
  private readonly leagueMetaData = inject(LeagueMetaDataService);
  private readonly ownersData = inject(OwnersDataService);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly weeklyMatchupsData = inject(WeeklyMatchupsDataService);

  private readonly ownerByTeamName = computed(() => {
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

    return ownerMap;
  });

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
      .slice(0, 10)
  );

  protected readonly topSeasonLowPoints = computed<SeasonTeamPointsRow[]>(() =>
    [...this.seasonPointsRows()]
      .sort((a, b) => {
        if (a.points !== b.points) return a.points - b.points;
        if (b.year !== a.year) return Number(b.year) - Number(a.year);
        return a.ownerName.localeCompare(b.ownerName);
      })
      .slice(0, 10)
  );

  protected readonly topSeasonHighPointsRows = computed<StarterGameListItem[]>(() =>
    this.topSeasonHighPoints().map((row) => ({
      value: row.points,
      playerDetails: row.year,
      teamName: row.ownerName,
    }))
  );

  protected readonly topSeasonLowPointsRows = computed<StarterGameListItem[]>(() =>
    this.topSeasonLowPoints().map((row) => ({
      value: row.points,
      playerDetails: row.year,
      teamName: row.ownerName,
    }))
  );

  private readonly allSingleGamePoints = computed<SingleGamePointsRow[]>(() => {
    const rows: SingleGamePointsRow[] = [];
    const ownerByTeamName = this.ownerByTeamName();

    for (const seasonId of this.weeklyMatchupsData.seasonIds()) {
      const meta = this.leagueMetaData.getSeasonMeta(seasonId);
      if (!meta) continue;

      for (let week = 1; week <= meta.regularSeasonEndWeek; week += 1) {
        const weekData = this.weeklyMatchupsData.getMatchupsForWeek(seasonId, `week${week}`);
        if (!weekData) continue;

        for (const entry of Object.values(weekData)) {
          const teamName = entry.matchup?.team1Name ?? '';
          const ownerName = ownerByTeamName.get(normalize(teamName)) ?? 'Unknown Owner';
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
      .slice(0, 10)
  );

  protected readonly topSingleGameLowPoints = computed<SingleGamePointsRow[]>(() =>
    [...this.allSingleGamePoints()]
      .sort((a, b) => {
        if (a.points !== b.points) return a.points - b.points;
        if (b.year !== a.year) return Number(b.year) - Number(a.year);
        if (a.week !== b.week) return a.week - b.week;
        return a.ownerName.localeCompare(b.ownerName);
      })
      .slice(0, 10)
  );

  protected readonly topSingleGameHighPointsRows = computed<StarterGameListItem[]>(() =>
    this.topSingleGameHighPoints().map((row) => ({
      value: row.points,
      playerDetails: `${row.year} ${row.ownerName}`,
      teamName: `Week ${String(row.week).padStart(2, '0')}`,
    }))
  );

  protected readonly topSingleGameLowPointsRows = computed<StarterGameListItem[]>(() =>
    this.topSingleGameLowPoints().map((row) => ({
      value: row.points,
      playerDetails: `${row.year} ${row.ownerName}`,
      teamName: `Week ${String(row.week).padStart(2, '0')}`,
    }))
  );
}
