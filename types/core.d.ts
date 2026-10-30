import type { CSSProperties, ReactNode } from 'react';
export type RowId = string | number;
export interface Sort { field: string; order: 'asc' | 'desc' }
export interface TableState {
  page: number; rowsPerPage: number; searchText: string;
  columnFilters: Record<string, unknown>; sorting: Sort[];
}
export interface StateEvent { type: keyof TableState | 'query'; changedKeys: (keyof TableState)[]; previousState: TableState }
export interface RowContext<Row> { row: Row; rowIndex: number; rowId: RowId }
export interface CellContext<Row, Value = unknown> extends RowContext<Row> { value: Value }
export interface Column<Row, Value = unknown> {
  field?: string; id?: string; label?: string; type?: 'display'; fields?: string[];
  dataType?: 'auto' | 'number' | 'string' | 'boolean' | 'date'; nulls?: 'first' | 'last'; locale?: string | string[];
  separator?: string; suffix?: string; valueGetter?: (row: Row) => Value; dateFormat?: string;
  renderCell?: (context: CellContext<Row, Value>) => ReactNode;
  sortable?: boolean; searchable?: boolean; filterable?: boolean;
  sortComparator?: (a: Value, b: Value) => number;
  filterFn?: (value: Value, filter: unknown, row: Row) => boolean;
  enableExport?: boolean; exportValue?: (row: Row, index: number) => unknown;
  width?: CSSProperties['width']; align?: 'left' | 'right' | 'center' | 'justify' | 'inherit';
}
export interface NormalizedColumn<Row, Value = unknown> extends Column<Row, Value> { field: string; label: string }
export interface RowModel<Row> { rows: Row[]; filteredRows: Row[]; count: number; page: number }
export interface RowModelOptions<Row> extends Partial<TableState> {
  data?: Row[]; headers?: Column<Row, any>[]; serverSide?: boolean; totalCount?: number;
}
export function createTableState(partial?: Partial<TableState>): TableState;
export function normalizeColumns<Row>(headers?: Column<Row, any>[]): NormalizedColumn<Row, any>[];
export function getColumnValue<Row, Value = unknown>(row: Row, column: Column<Row, Value>): Value | undefined;
export function getColumnText<Row>(row: Row, column: Column<Row, any>): string;
export function headersToExportColumns<Row>(headers: Column<Row, any>[]): import('./exports.js').ExportColumn<Row>[];
export function buildRowModel<Row>(options: RowModelOptions<Row>): RowModel<Row>;
