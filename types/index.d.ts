import type { ComponentType, ElementType, ReactElement, ReactNode } from 'react';
import type { Column, RowContext, RowId, RowModel, Sort, StateEvent, TableState } from './core.js';
import type { FileExportContext } from './exports.js';
import type { TableQuery } from './spring.js';
export * from './core.js';
export * from './exports.js';
export * from './spring.js';
export type StateUpdate = Partial<TableState> | ((previous: TableState) => Partial<TableState>);
export interface TableModelOptions<Row> {
  data?: Row[]; headers?: Column<Row, any>[]; currentPage?: number; initialRowsPerPage?: number;
  orderBy?: string; order?: 'asc' | 'desc'; serverSidePagination?: boolean; totalCount?: number;
  state?: Partial<TableState>; initialState?: Partial<TableState>;
  onStateChange?: (state: TableState, event: StateEvent) => void;
  onQueryChange?: (state: TableState, event: StateEvent) => void;
  onPageChangeRequest?: (query: TableState & TableQuery) => void;
}
export interface TableModel<Row> extends TableState, RowModel<Row> { state: TableState; update: (change: StateUpdate) => void }
export function useTableModel<Row>(options: TableModelOptions<Row>): TableModel<Row>;
export interface Action<Row> {
  id: string; label: string; onClick?: (row: Row) => void; icon?: ComponentType;
  visible?: (row: Row) => boolean; disabled?: boolean | ((row: Row) => boolean);
}
export type ExportFormat = 'csv' | 'txt' | 'json' | 'xlsx' | 'pdf';
export interface ExportProgress { loaded: number; total: number }
export interface ExportJob { signal: AbortSignal; onProgress: (progress: ExportProgress) => void }
export interface ExportInfo { format: ExportFormat; filename: string; state?: TableState }
export interface TableExportContext<Row> extends FileExportContext<Row> { state: TableState; signal: AbortSignal; onProgress: (progress: ExportProgress) => void }
export type ExportHandler<Row> = ((context: TableExportContext<Row>) => void | Promise<void>) |
  { mode: 'rows' | 'endpoint'; handler: (context: TableExportContext<Row>) => void | Promise<void> };
export interface TableSlots {
  root: ElementType; table: ElementType; toolbar: ElementType; header: ElementType;
  body: ElementType; row: ElementType; cell: ElementType; actionCell: ElementType; footer: ElementType;
}
export interface TableLabels {
  selection: string; selectAllRows: string; selectRow: (index: number) => string;
  table: string; empty: string; actions: string; email: string; sendEmail: string; selectAllEmails: string;
  selectEmailRow: (index: number) => string; search: string; openSearch: string; closeSearch: string;
  densePadding: string; fullscreen: string; loading: string; sortMenu: string; clearSorting: string; themeSelector: string;
  moveColumn: (label: string) => string; resizeColumn: (label: string) => string;
  moveColumnStart: string; moveColumnEnd: string; columnWidth: (width: number) => string;
  filter: (label: string) => string; about: (label: string) => string; sortSummary: (sorting: Sort[]) => string;
  rowsPerPage: string; firstPage: string; previousPage: string; nextPage: string; lastPage: string;
  displayedRows: (range: { from: number; to: number; count: number }) => string;
  exportMenu: string; exporting: string; cancelExport: string; exportProgress: (progress: ExportProgress) => string;
}
export type ToolbarControl = 'search' | 'density' | 'sort' | 'export' | 'themes' | 'fullscreen' | 'bulkActions' | 'custom';
export interface BulkActionContext<Row> {
  selectedRowIds: RowId[]; selectedRows: Row[]; selectedCount: number; unloadedSelectedRowIds: RowId[];
  clearSelection: () => void; disabled: boolean; state: TableState;
}
export interface DynamicTableProps<Row> extends TableModelOptions<Row> {
  getRowId?: (row: Row) => RowId; uniqueField?: string; pageTitle?: string; 'aria-label'?: string;
  searchByText?: boolean; enableSearch?: boolean; enableColumnFilters?: boolean; enableMultiColumnSort?: boolean;
  enableColumnReordering?: boolean; columnOrder?: string[]; initialColumnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  enableColumnResizing?: boolean; columnSizing?: Record<string, number>; initialColumnSizing?: Record<string, number>;
  onColumnSizingChange?: (sizing: Record<string, number>) => void;
  defaultColumnWidth?: number; minColumnWidth?: number; maxColumnWidth?: number;
  rowsPerPageOptions?: (number | { value: number; label: string })[];
  renderRowActions?: (context: RowContext<Row>) => ReactNode; enableRowActions?: boolean; actionsColumnLabel?: ReactNode;
  actions?: Action<Row>[]; showActionIcons?: boolean; actionVisibilityRules?: Record<string, (row: Row) => boolean>;
  enableView?: boolean; onView?: (row: Row) => void; enableEdit?: boolean; onEdit?: (row: Row) => void; editLabel?: string;
  enableDelete?: boolean; onDelete?: (row: Row) => void; deleteLabel?: string;
  enableClone?: boolean; onClone?: (row: Row) => void; enableReportLink?: boolean; onReportLink?: (row: Row) => void;
  enableEmail?: boolean; onEmail?: (rows: Row[]) => void;
  enableExport?: boolean; exportOptions?: Partial<Record<ExportFormat, boolean>>;
  exportHandlers?: Partial<Record<ExportFormat, ExportHandler<Row>>>;
  onExportStart?: (info: ExportInfo) => void; onExportComplete?: (info: ExportInfo & { rowCount?: number }) => void;
  onExportError?: (error: Error, info: ExportInfo) => void; onExportCancel?: (info: ExportInfo) => void;
  enableRowSelection?: boolean; selectionColumnLabel?: ReactNode;
  selectionColumnPosition?: 'first' | 'last' | number;
  renderBulkActions?: (context: BulkActionContext<Row>) => ReactNode;
  toolbarAlignment?: 'left' | 'right'; toolbarPositions?: Partial<Record<ToolbarControl, 'left' | 'right'>>;
  selectedRowIds?: RowId[]; initialSelectedRowIds?: RowId[]; onSelectionChange?: (ids: RowId[]) => void;
  selectionReset?: 'data' | 'dataset'; datasetKey?: string | number; selectionScope?: 'page' | 'filtered';
  slots?: Partial<TableSlots>; slotProps?: Partial<Record<keyof TableSlots, Record<string, unknown>>>; labels?: Partial<TableLabels>;
  fetchAllForExport?: (query: { orderBy: string; order: 'asc' | 'desc'; selectedColumns: Sort[];
    searchText: string; columnFilters: Record<string, unknown> }, job: ExportJob) => Row[] | Promise<Row[]>;
  loading?: boolean; error?: Error | string; emptyDataMessage?: ReactNode;
  stickyHeader?: boolean; maxHeight?: number | string; enableDensePadding?: boolean;
  enableFullScreenOption?: boolean; enableThemes?: boolean; tooltipFields?: Record<string, string[]>;
  renderToolbar?: (context: TableModel<Row> & { selectedRows: Row[]; selection: BulkActionContext<Row> }) => ReactNode;
}
export function DynamicTable<Row>(props: DynamicTableProps<Row>): ReactElement;
