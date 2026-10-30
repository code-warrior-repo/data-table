'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows } from './shared';
const headers = [{ field: 'name', label: 'Name', width: 240 },
  { field: 'score', label: 'Score', width: 100, align: 'right' },
  { field: 'status', label: 'Status (display only for queries)', sortable: false, searchable: false, filterable: false }];
export default function Example() { return <DynamicTable headers={headers} data={rows} searchByText enableColumnFilters />; }
