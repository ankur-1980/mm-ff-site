import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

export type MatchupResult = 'winner' | 'loser' | null;

export interface MatchupTeamData {
  teamName: string;
  ownerName: string;
  totalPoints: number;
  projectedPoints: number | null;
  result: MatchupResult;
}

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
