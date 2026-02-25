/**
 * Column definition for the reusable data table.
 * Pass per-column config; alignment can be inferred for numbers or set explicitly.
 */
export interface DataTableColumnDef {
  /** Property key on the row object. */
  key: string;
  /** Header label. */
  header: string;
  /** Fixed width in ch units. */
  widthCh?: number;
  /** Text alignment. If omitted, number columns are right-aligned. */
  align?: 'left' | 'center' | 'right';
  /** Optional key for subscript text (e.g. managerName under teamName). */
  subscriptKey?: string;
  /** If true, this column is the default sort column (ascending). */
  defaultSort?: boolean;
  /** Number display format for numeric columns. */
  format?: 'integer' | 'decimal2' | 'signedDecimal2' | 'percent2' | 'smartDecimal2';
}

/** Row type: arbitrary record for display. */
export type DataTableRow = Record<string, unknown>;

/**
 * Coerce a value to a number for sort/display when it looks like a number.
 * JSON often gives numeric fields as strings; use this so sort and alignment work.
 */
export function coerceNumber(value: unknown): number | unknown {
  if (value == null) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return value;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : value;
  }
  return value;
}

/**
 * Infer whether a column should be treated as numeric from the first row's value.
 */
export function isNumericColumn(
  key: string,
  data: DataTableRow[]
): boolean {
  const first = data[0];
  if (!first || !(key in first)) return false;
  const v = coerceNumber(first[key]);
  return typeof v === 'number';
}
