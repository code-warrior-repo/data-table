'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';

export default function Example() {

  return <DynamicTable headers={headers} data={rows} getRowId={row => row.id} initialRowsPerPage={3} rowsPerPageOptions={[3, 5, { value: -1, label: 'All' }]} />;
}
