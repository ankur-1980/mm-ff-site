import { Component } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';

export interface StandingsPreviewRow {
  rank: number;
  team: string;
  wl: string;
}

const PLACEHOLDER_ROWS: StandingsPreviewRow[] = [
  { rank: 1, team: 'Team Alpha', wl: '—' },
  { rank: 2, team: 'Team Bravo', wl: '—' },
  { rank: 3, team: 'Team Charlie', wl: '—' },
  { rank: 4, team: 'Team Delta', wl: '—' },
  { rank: 5, team: 'Team Echo', wl: '—' },
  { rank: 6, team: 'Team Foxtrot', wl: '—' }
];

@Component({
  selector: 'app-standings-preview',
  standalone: true,
  imports: [MatTableModule],
  templateUrl: './standings-preview.component.html',
  styleUrl: './standings-preview.component.scss'
})
export class StandingsPreviewComponent {
  readonly displayedColumns: string[] = ['rank', 'team', 'wl'];
  readonly dataSource = new MatTableDataSource<StandingsPreviewRow>(PLACEHOLDER_ROWS);
}
