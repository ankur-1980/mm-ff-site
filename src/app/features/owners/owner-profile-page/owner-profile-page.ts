import { Component, computed, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OwnersDataService } from '../../../data/owners-data.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';
import { ToiletBowlDataService } from '../../../data/toilet-bowl-data.service';
import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { StatValue } from '../../../shared/components/stat-card/stat-value/stat-value';
import { HeadToHeadMatrixService } from '../../all-time/head-to-head/head-to-head-matrix.service';
import { AllTimeAllPlayMatrixService } from '../../all-time/all-play/all-play-matrix.service';
import type { AllPlayPairRecord } from '../../season/season-analytics/models/all-play-matrix.models';

interface NameHistoryItem {
  name: string;
  lastYearUsed: number | null;
}

interface GamePointsAward {
  points: number;
  week: number;
  year: number;
}

interface SeasonStarterAward {
  playerName: string;
  points: number;
  year: number;
}

interface SingleGameStarterAward {
  playerName: string;
  points: number;
  week: number;
  year: number;
}

interface OwnerRecordListItem {
  ownerName: string;
  record: string;
  winPct: string;
}

interface OwnerWeeklySummary {
  gameScores: GamePointsAward[];
  starterPerformances: Array<{
    playerId: string;
    playerName: string;
    points: number;
    week: number;
    year: number;
  }>;
}

@Component({
  selector: 'app-owner-profile-page',
  imports: [RouterLink, StatCard, StatValue],
  templateUrl: './owner-profile-page.html',
  styleUrl: './owner-profile-page.scss',
})
export class OwnerProfilePage implements OnInit {
  private readonly ownersData = inject(OwnersDataService);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);
  private readonly weeklyMatchupsData = inject(WeeklyMatchupsDataService);
  private readonly toiletBowlData = inject(ToiletBowlDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);
  private readonly headToHeadMatrixService = inject(HeadToHeadMatrixService);
  private readonly allPlayMatrixService = inject(AllTimeAllPlayMatrixService);

  readonly ownerId = input.required<string>();

  ngOnInit(): void {
    const owner = this.owner();
    if (owner) {
      this.weeklyMatchupsData.loadSeasons(
        owner.activeSeasons.map((season) => String(season))
      );
    }

    this.toiletBowlData.load();
  }

  protected readonly owner = computed(() => this.ownersData.getOwner(this.ownerId()));

  protected readonly currentSeasonId = computed(
    () => this.leagueMeta.currentSeasonId() ?? null
  );

  private readonly headToHeadMatrix = computed(() =>
    this.headToHeadMatrixService.buildMatrix()
  );

  private readonly allPlayMatrix = computed(() =>
    this.allPlayMatrixService.buildMatrix()
  );

  protected readonly isActiveOwner = computed(() => {
    const owner = this.owner();
    const currentSeasonId = this.currentSeasonId();
    if (!owner || currentSeasonId == null) return false;
    return owner.activeSeasons.includes(currentSeasonId);
  });

  protected readonly allTimeRecord = computed(() => {
    const owner = this.owner();
    if (!owner) return '--';
    return `${owner.wins}-${owner.losses}-${owner.ties}`;
  });

  private readonly ownerSeasonEntries = computed(() => {
    const owner = this.owner();
    if (!owner) return [];

    return [...owner.activeSeasons]
      .sort((a, b) => a - b)
      .map((season) => ({
        season,
        entry: this.seasonStandingsData.getEntry(String(season), owner.managerName),
      }));
  });

  protected readonly mostRecentTeamName = computed(() => {
    const owner = this.owner();
    const latestSeasonEntry = this.ownerSeasonEntries().at(-1)?.entry;

    if (!owner) return '--';

    return latestSeasonEntry?.playerDetails.teamName ?? owner.teamNames[0] ?? '--';
  });

  protected readonly nameHistory = computed<NameHistoryItem[]>(() => {
    const owner = this.owner();
    const seasonEntries = this.ownerSeasonEntries();
    if (!owner) return [];

    return owner.teamNames
      .map((teamName) => {
        const lastYearUsed = seasonEntries.reduce<number | null>((latest, item) => {
          if (item.entry?.playerDetails.teamName !== teamName) return latest;
          return latest == null || item.season > latest ? item.season : latest;
        }, null);

        return { name: teamName, lastYearUsed };
      })
      .sort((a, b) => {
        if (a.lastYearUsed == null && b.lastYearUsed == null) {
          return a.name.localeCompare(b.name);
        }
        if (a.lastYearUsed == null) return 1;
        if (b.lastYearUsed == null) return -1;
        if (b.lastYearUsed !== a.lastYearUsed) return b.lastYearUsed - a.lastYearUsed;
        return a.name.localeCompare(b.name);
      });
  });

  protected readonly championshipYears = computed<Set<number>>(() => {
    const years = new Set<number>();
    for (const { season, entry } of this.ownerSeasonEntries()) {
      if (entry?.ranks.playoffRank === '1') years.add(season);
    }
    return years;
  });

  protected readonly toiletBowlYears = computed<Set<number>>(() => {
    const owner = this.owner();
    const years = new Set<number>();
    if (!owner) return years;

    for (const season of owner.activeSeasons) {
      const entry = this.toiletBowlData.getEntry(String(season));
      if (entry?.champion === owner.managerName) years.add(season);
    }

    return years;
  });

  protected readonly activeSeasonYears = computed(() => {
    const owner = this.owner();
    const championshipYears = this.championshipYears();
    const toiletBowlYears = this.toiletBowlYears();
    if (!owner) return [];

    return [...owner.activeSeasons]
      .sort((a, b) => a - b)
      .map((year) => ({
        year,
        isChampion: championshipYears.has(year),
        isToiletBowlChampion: toiletBowlYears.has(year),
      }));
  });

  protected readonly seasonPointsAwards = computed(() => {
    const pointsByYear = this.ownerSeasonEntries()
      .filter((item) => item.entry != null)
      .map((item) => ({
        year: item.season,
        points: item.entry!.points.pointsFor,
      }));

    if (!pointsByYear.length) {
      return { highest: null, lowest: null };
    }

    const highest = pointsByYear.reduce((best, current) =>
      current.points > best.points ? current : best
    );
    const lowest = pointsByYear.reduce((best, current) =>
      current.points < best.points ? current : best
    );

    return { highest, lowest };
  });

  private readonly ownerWeeklySummary = computed<OwnerWeeklySummary>(() => {
    const owner = this.owner();
    if (!owner) {
      return {
        gameScores: [],
        starterPerformances: [],
      };
    }

    const ownerTeamNames = new Set(owner.teamNames);
    const gameScores: GamePointsAward[] = [];
    const starterPerformances: OwnerWeeklySummary['starterPerformances'] = [];

    for (const season of owner.activeSeasons) {
      const seasonId = String(season);
      const seasonTeamOwnerMap = this.getSeasonTeamOwnerMap(seasonId);

      for (const weekKey of this.weeklyMatchupsData.getWeekKeysForSeason(seasonId)) {
        const weekEntries = this.weeklyMatchupsData.getMatchupsForWeek(seasonId, weekKey);
        if (!weekEntries) continue;

        for (const matchupEntry of Object.values(weekEntries)) {
          const teamName = matchupEntry.matchup.team1Name;
          const managerForTeam = seasonTeamOwnerMap.get(teamName);
          const belongsToOwner =
            managerForTeam === owner.managerName ||
            (managerForTeam == null && ownerTeamNames.has(teamName));

          if (!belongsToOwner) continue;

          gameScores.push({
            points: matchupEntry.team1Totals.totalPoints,
            week: matchupEntry.week,
            year: matchupEntry.season,
          });
          for (const starter of matchupEntry.team1Roster.filter(
            (player) => player.slot === 'starter'
          )) {
            starterPerformances.push({
              playerId: starter.playerId,
              playerName: starter.playerName,
              points: starter.points,
              week: matchupEntry.week,
              year: matchupEntry.season,
            });
          }
        }
      }
    }

    return { gameScores, starterPerformances };
  });

  protected readonly gamePointsAwards = computed(() => {
    const scores = this.ownerWeeklySummary().gameScores;
    if (!scores.length) {
      return { highest: null, lowest: null };
    }

    const highest = scores.reduce((best, current) =>
      current.points > best.points ? current : best
    );
    const lowest = scores.reduce((best, current) =>
      current.points < best.points ? current : best
    );

    return { highest, lowest };
  });

  protected readonly starterAwards = computed(() => {
    const performances = this.ownerWeeklySummary().starterPerformances;

    if (!performances.length) {
      return {
        bestSeason: null as SeasonStarterAward | null,
        bestGame: null as SingleGameStarterAward | null,
      };
    }

    const seasonTotals = new Map<
      string,
      { playerName: string; points: number; year: number }
    >();

    for (const performance of performances) {
      const key = `${performance.year}|${performance.playerId}`;
      const current = seasonTotals.get(key);

      if (current) {
        current.points += performance.points;
      } else {
        seasonTotals.set(key, {
          playerName: performance.playerName,
          points: performance.points,
          year: performance.year,
        });
      }
    }

    const bestSeason =
      Array.from(seasonTotals.values()).reduce<SeasonStarterAward | null>(
        (best, current) => {
          if (!best || current.points > best.points) {
            return current;
          }
          return best;
        },
        null
      );

    const bestGame =
      performances.reduce<SingleGameStarterAward | null>((best, current) => {
        if (!best || current.points > best.points) {
          return current;
        }
        return best;
      }, null);

    return { bestSeason, bestGame };
  });

  protected readonly headToHeadRecords = computed<OwnerRecordListItem[]>(() => {
    const owner = this.owner();
    const matrix = this.headToHeadMatrix();
    if (!owner || !matrix) return [];

    return matrix.teamNames
      .filter((name) => name !== owner.managerName)
      .map((name) => {
        const record = matrix.getRecord(owner.managerName, name);
        return {
          ownerName: name,
          record: this.formatRecord(record),
          winPct: this.formatWinPct(record),
        };
      })
      .sort((a, b) => a.ownerName.localeCompare(b.ownerName));
  });

  protected readonly allPlayRecords = computed<OwnerRecordListItem[]>(() => {
    const owner = this.owner();
    const matrix = this.allPlayMatrix();
    if (!owner || !matrix) return [];

    const ownerDisplay = matrix.teamNames.find(
      (display) => this.parseOwnerDisplay(display).ownerName === owner.managerName
    );
    if (!ownerDisplay) return [];

    return matrix.teamNames
      .filter((display) => display !== ownerDisplay)
      .map((display) => {
        const parsed = this.parseOwnerDisplay(display);
        const record = matrix.getRecord(ownerDisplay, display);
        return {
          ownerName: parsed.ownerName,
          record: this.formatRecord(record),
          winPct: this.formatWinPct(record),
        };
      })
      .sort((a, b) => a.ownerName.localeCompare(b.ownerName));
  });

  protected formatSeasonFooter(year: number | null): string {
    return year == null ? '--' : String(year);
  }

  protected formatGameFooter(award: GamePointsAward | null): string {
    if (!award) return '--';
    return `Week ${award.week} / ${award.year}`;
  }

  protected formatStarterGameFooter(award: SingleGameStarterAward | null): string {
    if (!award) return '--';
    return `Week ${award.week} / ${award.year}`;
  }

  protected formatPointsToTwoDecimals(points: number | null | undefined): string {
    return points == null ? '--' : points.toFixed(2);
  }

  private getSeasonTeamOwnerMap(seasonId: string): Map<string, string> {
    const seasonTeamOwnerMap = new Map<string, string>();
    const seasonStandings = this.seasonStandingsData.getStandingsForSeason(seasonId);

    if (!seasonStandings) return seasonTeamOwnerMap;

    for (const standingsEntry of Object.values(seasonStandings)) {
      seasonTeamOwnerMap.set(
        standingsEntry.playerDetails.teamName,
        standingsEntry.playerDetails.managerName
      );
    }

    return seasonTeamOwnerMap;
  }

  private parseOwnerDisplay(value: string): { ownerName: string; seasonsActive: number } {
    const match = value.match(/^(.*)\s\((\d+)\)$/);
    return {
      ownerName: match ? match[1] : value,
      seasonsActive: match ? Number(match[2]) : 0,
    };
  }

  private formatRecord(record: AllPlayPairRecord): string {
    if (record.wins === 0 && record.losses === 0 && record.ties === 0) return '--';
    return `${record.wins}-${record.losses}-${record.ties}`;
  }

  private formatWinPct(record: AllPlayPairRecord): string {
    const games = record.wins + record.losses + record.ties;
    if (games === 0) return '--';
    const pct = ((record.wins + 0.5 * record.ties) / games) * 100;
    return `${pct.toFixed(2)}%`;
  }
}
