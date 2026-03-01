import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatListV3Row = {
  id?: string | number;
  value: number | string;
  primary: string;
  meta1?: string;
  meta2?: string;
};

@Component({
  selector: 'app-stat-list-v3',
  imports: [DecimalPipe],
  templateUrl: './stat-list-v3.component.html',
  styleUrl: './stat-list-v3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'stat-list-v3-host',
    '[class.stat-list-v3-host--stacked-meta]': 'layout() === "stackedMeta"',
    '[class.stat-list-v3-host--split-meta]': 'layout() === "splitMeta"',
  },
})
export class StatListV3Component {
  // Base rows use [VALUE PRIMARY][META-1]; layout variants can remap placement and optionally render META-2.
  readonly rows = input.required<StatListV3Row[]>();
  readonly layout = input<'base' | 'stackedMeta' | 'splitMeta'>('base');

  protected trackRow(index: number, row: StatListV3Row): string | number {
    return row.id ?? index;
  }

  protected resolveDigitsInfo(value: number): string {
    return Number.isInteger(value) ? '1.0-0' : '1.2-2';
  }
}
