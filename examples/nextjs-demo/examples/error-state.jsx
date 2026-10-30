'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';

export default function Example() {

  return <DynamicTable headers={headers} data={rows} getRowId={row => row.id} error={new Error('The example request failed.')} />;
}
