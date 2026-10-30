'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  return <DynamicTable headers={headers} data={rows} pageTitle="Customers" searchByText enableExport enableThemes
    toolbarAlignment="left" toolbarPositions={{ export: 'right', themes: 'right' }} />;
}
