import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { DraftRostersDataService } from '../../../data/draft-rosters-data.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';
import type { DraftRosterPlayer } from '../../../models/draft-rosters.model';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { SubsectionHeader } from '../../../shared/components/subsection-header/subsection-header';

interface DraftRow {
  costLabel: string;
  sortCost: number;
  isKeeper: boolean;
  playerLabel: string;
}

interface DraftTeamCard {
  teamName: string;
  ownerName: string;
  rows: DraftRow[];
}

function normalizeTeamForMatch(name: string): string {
  return name != null ? String(name).trim().toLowerCase() : '';
}

function parseCost(cost: string): number | null {
  const raw = String(cost ?? '').trim();
  if (!raw) return null;
  const parsed = Number(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function toDraftRow(player: DraftRosterPlayer): DraftRow {
  const parsedCost = parseCost(player.Cost);
  const isKeeper = parsedCost == null || parsedCost === 0;
  const nflTeam = (player.NFLTeam ?? '').trim();
  const teamContext = nflTeam ? nflTeam : '-';

  return {
    costLabel: isKeeper ? 'Keeper' : `$${parsedCost}`,
    sortCost: parsedCost ?? 0,
    isKeeper,
    playerLabel: `${player.PlayerName} (${player.Position} - ${teamContext})`,
  };
}

@Component({
  selector: 'app-season-draft',
  imports: [SubsectionHeader, StatCard],
  templateUrl: './season-draft.html',
  styleUrl: './season-draft.scss',
})
export class SeasonDraft {
  private readonly route = inject(ActivatedRoute);
  private readonly draftRostersData = inject(DraftRostersDataService);
  private readonly seasonStandingsData = inject(SeasonStandingsDataService);

  constructor() {
    this.draftRostersData.load();
  }

  private readonly year = toSignal(
    (this.route.parent ?? this.route).params.pipe(
      map((p) => (p['year'] ? Number(p['year']) : null))
    ),
    { initialValue: null }
  );

  protected readonly draftCards = computed<DraftTeamCard[]>(() => {
    const y = this.year();
    if (y == null) return [];

    const seasonId = String(y);
    const seasonDraft = this.draftRostersData.getRostersForSeason(seasonId);
    if (!seasonDraft) return [];

    const seasonStandings = this.seasonStandingsData.getStandingsForSeason(seasonId);
    const ownerByTeam = new Map<string, string>();

    if (seasonStandings) {
      for (const entry of Object.values(seasonStandings)) {
        const teamName = entry.playerDetails?.teamName ?? '';
        const managerName = entry.playerDetails?.managerName ?? '';
        ownerByTeam.set(normalizeTeamForMatch(teamName), managerName);
      }
    }

    return Object.entries(seasonDraft)
      .map(([teamName, players]) => {
        const rows = [...players]
          .map(toDraftRow)
          .sort((a, b) => {
            if (a.isKeeper !== b.isKeeper) return a.isKeeper ? -1 : 1;
            if (a.sortCost !== b.sortCost) return b.sortCost - a.sortCost;
            return a.playerLabel.localeCompare(b.playerLabel);
          });

        return {
          teamName,
          ownerName: ownerByTeam.get(normalizeTeamForMatch(teamName)) ?? '',
          rows,
        };
      })
      .sort((a, b) => a.teamName.localeCompare(b.teamName));
  });
}
