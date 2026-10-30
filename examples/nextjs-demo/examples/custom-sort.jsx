'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows } from './shared';
const rank = { Active: 0, Pending: 1, Inactive: 2 };
const headers = [{ field: 'name', label: 'Name' },
  { field: 'status', label: 'Status', sortComparator: (a, b) => rank[a] - rank[b] }];
export default function Example() { return <DynamicTable headers={headers} data={rows} orderBy="status" />; }
