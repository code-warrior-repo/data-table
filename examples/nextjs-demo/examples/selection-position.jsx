'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  return <DynamicTable headers={headers} data={rows} enableRowSelection selectionColumnPosition={1}
    renderRowActions={({ row }) => <span>Record: {row.id}</span>} />;
}
