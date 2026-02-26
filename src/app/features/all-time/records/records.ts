import { Component, computed, inject } from '@angular/core';

import { DataTableComponent } from '../../../shared/table';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import {
  StarterGameList,
  StarterGameListItem,
} from '../../../shared/components/stat-card/stat-list/starter-game-list/starter-game-list';
import { AllTimeRecordsService } from './records.service';

@Component({
  selector: 'app-all-time-records',
  imports: [DataTableComponent, StatCard, StarterGameList],
  templateUrl: './records.html',
  styleUrl: './records.scss',
})
export class AllTimeRecords {
  private readonly records = inject(AllTimeRecordsService);

  protected readonly tableState = computed(() => this.records.toTableState());
  protected readonly championsTimeline = computed(() => this.records.getChampionsTimeline());
  protected readonly championRows = computed<StarterGameListItem[]>(() =>
    this.championsTimeline().map((row) => ({
      value: row.year,
      playerDetails: row.ownerName,
      teamName: row.teamName,
    }))
  );
}
