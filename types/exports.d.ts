export interface ExportColumn<Row> {
  accessorKey?: string; accessorFn?: (row: Row, index: number) => unknown;
  exportValue?: (row: Row, index: number) => unknown; id?: string; header?: unknown;
  exportHeader?: unknown; enableExport?: boolean; columns?: ExportColumn<Row>[];
}
export interface ExportContext<Row> { rows: Row[]; columns: ExportColumn<Row>[]; title?: string; signal?: AbortSignal }
export interface FileExportContext<Row> extends ExportContext<Row> { filename?: string }
export function getExportData<Row>(context: ExportContext<Row>): { headers: string[]; keys: string[]; values: unknown[][] };
export function rowsToCsv<Row>(context: ExportContext<Row>): string;
export function rowsToTxt<Row>(context: ExportContext<Row>): string;
export function rowsToJson<Row>(context: ExportContext<Row>): string;
export function exportRowsAsCsv<Row>(context: FileExportContext<Row>): void;
export function exportRowsAsTxt<Row>(context: FileExportContext<Row>): void;
export function exportRowsAsJson<Row>(context: FileExportContext<Row>): void;
export function exportRowsAsXlsx<Row>(context: FileExportContext<Row>): Promise<void>;
export function exportRowsAsPdf<Row>(context: FileExportContext<Row>): Promise<void>;
export function createXlsxBlob<Row>(context: ExportContext<Row>): Promise<Blob>;
export function createPdfBlob<Row>(context: ExportContext<Row>): Promise<Blob>;
export function downloadBlob(blob: Blob, filename: string): void;
export interface EndpointExportOptions {
  url: string; filename: string; fetcher?: typeof fetch; signal?: AbortSignal; method?: string; body?: unknown;
}
export function exportWithEndpoint(options: EndpointExportOptions): Promise<void>;
export const defaultExportHandlers: {
  csv: typeof exportRowsAsCsv; txt: typeof exportRowsAsTxt; json: typeof exportRowsAsJson;
  xlsx: typeof exportRowsAsXlsx; pdf: typeof exportRowsAsPdf;
};
