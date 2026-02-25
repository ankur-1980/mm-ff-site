import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { MatchupTeam, type MatchupTeamData } from '../matchup-team/matchup-team';

@Component({
  selector: 'app-matchup-card',
  imports: [MatCardModule, MatDividerModule, MatchupTeam],
  templateUrl: './matchup-card.html',
  styleUrl: './matchup-card.scss',
})
export class MatchupCard {
  readonly team1 = input.required<MatchupTeamData>();
  readonly team2 = input.required<MatchupTeamData>();
}
