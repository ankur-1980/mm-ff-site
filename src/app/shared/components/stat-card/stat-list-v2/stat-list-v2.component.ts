import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatListV2ValueFormat = 'auto' | '0' | '2';

export type StatListV2Row = {
  id?: string | number;
  value: number | string;
  primary: string;
  meta?: string[];
  valueFormat?: StatListV2ValueFormat;
};

@Component({
  selector: 'app-stat-list-v2',
  imports: [DecimalPipe],
  templateUrl: './stat-list-v2.component.html',
  styleUrl: './stat-list-v2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'stat-list-v2-host',
    '[class.stat-list-v2-host--sm]': 'width() === "sm"',
    '[class.stat-list-v2-host--lg]': 'width() === "lg"',
    '[class.stat-list-v2-host--density-sm]': 'density() === "sm"',
    '[class.stat-list-v2-host--density-md]': 'density() === "md"',
  },
})
export class StatListV2Component {
  readonly rows = input.required<StatListV2Row[]>();
  readonly width = input<'sm' | 'lg'>('sm');
  readonly density = input<'sm' | 'md'>('md');
  readonly defaultValueFormat = input<StatListV2ValueFormat>('auto');

  protected readonly normalizedRows = computed(() =>
    this.rows().map((row) => ({
      ...row,
      meta: row.meta ?? [],
    })),
  );

  // How to add new row shapes:
  // callers create `primary` + `meta[]` in the desired order; the template stays unchanged.
  protected trackRow(index: number, row: StatListV2Row): string | number {
    return row.id ?? index;
  }

  protected trackMeta(index: number): number {
    return index;
  }

  protected resolveDigitsInfo(row: StatListV2Row): string {
    const format = row.valueFormat ?? this.defaultValueFormat();

    if (format === '2') {
      return '1.2-2';
    }

    if (format === '0') {
      return '1.0-0';
    }

    return typeof row.value === 'number' && Number.isInteger(row.value) ? '1.0-0' : '1.2-2';
  }
}
