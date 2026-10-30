'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';

export default function Example() {

  return <DynamicTable headers={headers} data={rows} getRowId={row => row.id} tooltipFields={{ name: ['Customer display name'], score: ['Points from the latest assessment'] }} />;
}
