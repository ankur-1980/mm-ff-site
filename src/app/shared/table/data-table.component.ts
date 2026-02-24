import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, input, viewChild } from '@angular/core';
import { MatSort, MatSortHeader, MatSortModule } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';

import {
  coerceNumber,
  type DataTableColumnDef,
  type DataTableRow,
  isNumericColumn,
} from './table.models';

@Component({
  selector: 'app-data-table',
  imports: [MatTableModule, MatSortModule, MatSortHeader, DecimalPipe, NgTemplateOutlet],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T extends DataTableRow = DataTableRow> {
  private readonly matSort = viewChild.required(MatSort);

  /** Column definitions. */
  readonly columns = input.required<DataTableColumnDef[]>();
  /** Row data (array of objects keyed by column keys). */
  readonly data = input.required<T[]>();

  protected readonly dataSource = new MatTableDataSource<T>([]);

  /** Default sort column key and direction for template. */
  readonly defaultSortKey = computed(() => {
    const cols = this.columns();
    const def = cols.find((c) => c.defaultSort) ?? cols[0];
    return def?.key ?? null;
  });
  protected readonly defaultSortDirection = 'asc' as const;

  /** Column key list for matHeaderRowDef / matRowDef. */
  readonly columnKeys = computed(() => this.columns().map((c) => c.key));

  /** Numeric column keys: format is authoritative when set, else inferred from data. */
  readonly numericKeys = computed(() => {
    const cols = this.columns();
    const rows = this.data();
    const set = new Set<string>();
    const numericFormats = ['integer', 'decimal2', 'percent2'] as const;
    cols.forEach((c) => {
      if (c.format && numericFormats.includes(c.format)) {
        set.add(c.key);
      } else if (isNumericColumn(c.key, rows)) {
        set.add(c.key);
      }
    });
    return set;
  });

  constructor() {
    effect(() => {
      const rows = this.data();
      // Read columns to re-register sortingDataAccessor when column defs change.
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
