'use client';
import { getExportData, headersToExportColumns, normalizeColumns, rowsToCsv, rowsToTxt, rowsToJson } from '@company/mui-data-table';
import { rows, headers } from './shared';
const context = { rows: rows.slice(0, 2), columns: headersToExportColumns(normalizeColumns(headers)) };
export default function Example() {
  return <>{[['CSV', rowsToCsv(context)], ['TXT', rowsToTxt(context)], ['JSON', rowsToJson(context)],
    ['Projected data', JSON.stringify(getExportData(context), null, 2)]].map(([label, value]) =>
      <section key={label}><h2>{label}</h2><pre style={{ whiteSpace: 'pre-wrap' }}>{value}</pre></section>)}</>;
}
