import { Component, computed, inject } from '@angular/core';

import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
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

@Component({
  selector: 'app-awards',
  imports: [StatCard, StarterGameList],
  templateUrl: './awards.html',
  styleUrl: './awards.scss',
})
export class Awards {
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);

  protected readonly topSeasonHighPoints = computed<SeasonTeamPointsRow[]>(() => {
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

    return rows
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.year !== a.year) return Number(b.year) - Number(a.year);
        return a.ownerName.localeCompare(b.ownerName);
      })
      .slice(0, 10);
  });

  protected readonly topSeasonHighPointsRows = computed<StarterGameListItem[]>(() =>
    this.topSeasonHighPoints().map((row) => ({
      value: row.points,
      playerDetails: row.year,
      teamName: row.ownerName,
    }))
  );
}
