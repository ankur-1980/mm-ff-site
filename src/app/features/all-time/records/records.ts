import { Component, computed, inject } from '@angular/core';

import { DataTableComponent } from '../../../shared/table';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { AllTimeRecordsService } from './records.service';
import { StatList, StatListItem } from '../../../shared/components/stat-card/stat-list/stat-list';

@Component({
  selector: 'app-all-time-records',
  imports: [DataTableComponent, StatCard, StatList, StatList],
  templateUrl: './records.html',
  styleUrl: './records.scss',
})
export class AllTimeRecords {
  private readonly records = inject(AllTimeRecordsService);

  protected readonly tableState = computed(() => this.records.toTableState());
  protected readonly championsTimeline = computed(() => this.records.getChampionsTimeline());
  protected readonly seasonHighPointsTimeline = computed(() =>
    this.records.getSeasonHighPointsTimeline(),
  );
  protected readonly championRows = computed<StatListItem[]>(() =>
    this.championsTimeline().map((row) => ({
      value: row.year,
      playerDetails: row.ownerName,
      teamName: row.teamName,
    })),
  );
  protected readonly seasonHighPointsRows = computed<StatListItem[]>(() =>
    this.seasonHighPointsTimeline().map((row) => ({
      value: row.year,
      playerDetails: row.points.toFixed(2),
      teamName: row.ownerName,
    })),
  );
}
