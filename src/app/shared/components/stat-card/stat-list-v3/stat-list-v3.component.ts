import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatListV3Row = {
  id?: string | number;
  value: number | string;
  primary: string;
  meta1: string;
};

@Component({
  selector: 'app-stat-list-v3',
  imports: [DecimalPipe],
  templateUrl: './stat-list-v3.component.html',
  styleUrl: './stat-list-v3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatListV3Component {
  // Phase 1 builds only [VALUE PRIMARY][META-1]; future phases add configs and additional metas.
  readonly rows = input.required<StatListV3Row[]>();

  protected trackRow(index: number, row: StatListV3Row): string | number {
    return row.id ?? index;
  }

  protected resolveDigitsInfo(value: number): string {
    return Number.isInteger(value) ? '1.0-0' : '1.2-2';
  }
}
