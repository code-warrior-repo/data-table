import type { Sort, TableState, RowId } from './core.js';
export interface SpringPage<Row> { content?: Row[]; totalElements?: number; totalPages?: number }
export interface NormalizedPage<Row> { rows: Row[]; rowCount: number; pageCount?: number }
export interface SpringRequest {
  pagination: { pageIndex: number; pageSize: number }; sorting?: { id: string; desc: boolean }[];
  globalFilter?: string; columnFilters?: { id: string; value: unknown }[]; signal?: AbortSignal;
}
export interface TableQuery extends Partial<TableState> {
  sortBy?: string; sortDir?: 'asc' | 'desc'; orderBy?: string; order?: 'asc' | 'desc'; selectedColumns?: Sort[];
}
export function normalizeSpringPage<Row>(page: SpringPage<Row>): NormalizedPage<Row> & { pageCount: number };
export function toSpringRequest(query?: TableQuery, options?: { signal?: AbortSignal; pageSize?: number }): SpringRequest;
export interface SpringSourceOptions {
  url: string; fetcher?: typeof fetch; params?: Record<string, unknown>;
  mapSort?: (sorting: { id: string; desc: boolean }[]) => string[];
}
export type SpringDataSource<Row> = (request: SpringRequest) => Promise<NormalizedPage<Row>>;
export function createSpringDataSource<Row = Record<string, unknown>>(options: SpringSourceOptions): SpringDataSource<Row>;
export interface SpringExportProgress { loaded: number; total: number; page: number; pagesFetched: number }
export interface SpringExportOptions<Row> {
  dataSource: SpringDataSource<Row>; query?: TableQuery; pageSize?: number; maxRows?: number; maxPages?: number;
  signal?: AbortSignal; getRowId?: (row: Row) => RowId; onProgress?: (progress: SpringExportProgress) => void;
}
export function fetchAllSpringRows<Row>(options: SpringExportOptions<Row>): Promise<Row[]>;
