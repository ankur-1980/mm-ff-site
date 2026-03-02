import { Component, computed, inject } from '@angular/core';

import { DataTableComponent } from '../../../shared/table';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { AllTimeRecordsService } from './records.service';
import {
  StatListV3Component,
  type StatListV3Row,
} from '../../../shared/components/stat-card/stat-list-v3/stat-list-v3.component';
import { SubsectionHeader } from '../../../shared/components/subsection-header/subsection-header';

@Component({
  selector: 'app-all-time-records',
  imports: [DataTableComponent, StatCard, StatListV3Component, SubsectionHeader],
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
  protected readonly championRows = computed<StatListV3Row[]>(() =>
    this.championsTimeline().map((row) => ({
      id: `champion|${row.year}|${row.ownerName}|${row.teamName}`,
      value: row.year,
      primary: row.ownerName,
      meta1: row.teamName,
    })),
  );
  protected readonly seasonHighPointsRows = computed<StatListV3Row[]>(() =>
    this.seasonHighPointsTimeline().map((row) => ({
      id: `season-high|${row.year}|${row.ownerName}|${row.points.toFixed(2)}`,
      value: row.year,
      primary: row.points.toFixed(2),
      meta1: row.ownerName,
    })),
  );
}
