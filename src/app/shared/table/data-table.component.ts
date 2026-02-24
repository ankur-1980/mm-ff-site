import { DecimalPipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  input,
  ViewChild
} from '@angular/core';
import { MatSort, MatSortHeader, MatSortModule } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';

import {
  coerceNumber,
  type DataTableColumnDef,
  type DataTableRow,
  isNumericColumn
} from './table.models';

@Component({
  selector: 'app-data-table',
  imports: [MatTableModule, MatSortModule, MatSortHeader, DecimalPipe],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T extends DataTableRow = DataTableRow> {
  @ViewChild(MatSort) matSort!: MatSort;

  /** Column definitions. */
  readonly columns = input.required<DataTableColumnDef[]>();
  /** Row data (array of objects keyed by column keys). */
  readonly data = input.required<T[]>();

  private readonly dataSource = new MatTableDataSource<T>([]);

  /** Default sort column key and direction for template. */
  readonly defaultSortKey = computed(() => {
    const cols = this.columns();
    const def = cols.find((c) => c.defaultSort) ?? cols[0];
    return def?.key ?? null;
  });
  readonly defaultSortDirection = computed(() => 'asc' as const);

  /** Column key list for matHeaderRowDef / matRowDef. */
  readonly columnKeys = computed(() => this.columns().map((c) => c.key));

  /** Numeric column keys (inferred from first row). */
  readonly numericKeys = computed(() => {
    const cols = this.columns();
    const rows = this.data();
    const set = new Set<string>();
    cols.forEach((c) => {
      if (isNumericColumn(c.key, rows)) set.add(c.key);
    });
    return set;
  });

  constructor() {
    effect(() => {
      const rows = this.data();
      const cols = this.columns();
      this.dataSource.data = rows;
      this.dataSource.sortingDataAccessor = (row: T, property: string): string | number => {
        const val = row[property];
        if (this.numericKeys().has(property)) {
          const n = coerceNumber(val);
          return typeof n === 'number' ? n : Number.NaN;
        }
        return val != null ? String(val) : '';
      };
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.matSort;
  }

  getDataSource(): MatTableDataSource<T> {
    return this.dataSource;
  }

  /** Alignment for a column: explicit or right for numeric. */
  getAlign(col: DataTableColumnDef): 'left' | 'center' | 'right' {
    if (col.align) return col.align;
    return this.numericKeys().has(col.key) ? 'right' : 'left';
  }

  /** Whether to show the spacer (right-aligned body cell). */
  hasSpacer(col: DataTableColumnDef): boolean {
    return this.getAlign(col) === 'right';
  }

  /** Cell value for display; null/undefined shown as —. */
  cellValue(row: T, key: string): string | number | null {
    const v = row[key];
    if (v == null || v === '') return '—';
    const n = coerceNumber(v);
    return typeof n === 'number' ? n : String(v);
  }

  /** Subscript value (e.g. managerName under teamName). */
  subscriptValue(row: T, key: string): string {
    const v = row[key];
    return v != null ? String(v) : '';
  }

  /** Whether the cell value is numeric for formatting. */
  isNumericCell(col: DataTableColumnDef): boolean {
    return this.numericKeys().has(col.key);
  }

  /** Angular number pipe format string for the column (e.g. '1.0-0', '1.2-2'). */
  numberFormat(col: DataTableColumnDef): string {
    switch (col.format) {
      case 'integer':
        return '1.0-0';
      case 'percent2':
        return '1.2-2';
      case 'decimal2':
        return '1.2-2';
      default:
        return '1.1-1';
    }
  }

  /** Whether to append % after the value (for percent2). */
  numberSuffix(col: DataTableColumnDef): string {
    return col.format === 'percent2' ? '%' : '';
  }
}
