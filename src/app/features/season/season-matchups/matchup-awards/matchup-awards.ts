import { Component, input } from '@angular/core';

import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { StatValue } from '../../../../shared/components/stat-card/stat-value/stat-value';
import type { PlayerStat, WeekStats } from '../weekly-stats.models';

@Component({
  selector: 'app-matchup-awards',
  imports: [StatCard, StatValue],
  templateUrl: './matchup-awards.html',
  styleUrl: './matchup-awards.scss',
})
export class MatchupAwards {
  readonly stats = input<WeekStats | null>(null);

  protected formatPlayerContext(player: PlayerStat): string {
    const position = player.position === 'R/W/T' ? 'Flex' : player.position;
    return `${position} · ${player.playerName} · ${player.nflTeam}`;
  }
}
