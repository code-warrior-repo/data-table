'use client';
import { DynamicTable } from '@company/mui-data-table';
import { headers } from './shared';

export default function Example() {

  return <DynamicTable headers={headers} data={[]} getRowId={row => row.id} emptyDataMessage="No customers have been added yet." />;
}
