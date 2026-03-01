import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import type { MatchupTeamData } from '../../../../models/matchup.model';

@Component({
  selector: 'app-matchup-card-v2',
  imports: [DecimalPipe, MatCardModule],
  templateUrl: './matchup-card-v2.html',
  styleUrl: './matchup-card-v2.scss',
})
export class MatchupCardV2 {
  readonly team1 = input.required<MatchupTeamData>();
  readonly team2 = input.required<MatchupTeamData>();
}
