'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows } from './shared';
const headers = [{ field: 'name', label: 'Name', filterable: false },
  { field: 'score', label: 'Minimum score', filterFn: (value, filter) => value >= Number(filter) }];
export default function Example() { return <DynamicTable headers={headers} data={rows} enableColumnFilters />; }
