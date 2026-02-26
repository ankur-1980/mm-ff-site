import { Component, computed, inject } from '@angular/core';

import { DataTableComponent } from '../../../shared/table';
import { AllTimeRecordsService } from './records.service';

@Component({
  selector: 'app-all-time-records',
  imports: [DataTableComponent],
  templateUrl: './records.html',
  styleUrl: './records.scss',
})
export class AllTimeRecords {
  private readonly records = inject(AllTimeRecordsService);

  protected readonly tableState = computed(() => this.records.toTableState());
}
