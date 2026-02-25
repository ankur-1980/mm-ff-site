import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import type { MatchupResult, MatchupTeamData } from '../matchup.models';

export type { MatchupResult, MatchupTeamData };

@Component({
  selector: 'app-matchup-team',
  imports: [DecimalPipe, MatDividerModule],
  templateUrl: './matchup-team.html',
  styleUrl: './matchup-team.scss',
})
export class MatchupTeam {
  readonly teamName = input.required<string>();
  readonly ownerName = input.required<string>();
  readonly totalPoints = input.required<number>();
  readonly projectedPoints = input<number | null>(null);
  readonly result = input<MatchupResult>(null);
}
