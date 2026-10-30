'use client';
import { buildRowModel } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const result = buildRowModel({ data: rows, headers, searchText: 'Active',
    columnFilters: { status: 'Active' }, sorting: [{ field: 'score', order: 'desc' }], rowsPerPage: 3 });
  return <pre aria-label="Row model result">{JSON.stringify(result, null, 2)}</pre>;
}
