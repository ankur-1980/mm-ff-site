import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-all-time-analytics-sidebar',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './analytics-sidebar.html',
  styleUrl: './analytics-sidebar.scss',
})
export class AnalyticsSidebar {}
