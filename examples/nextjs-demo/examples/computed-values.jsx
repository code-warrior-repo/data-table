'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows } from './shared';
const headers = [{ field: 'name', label: 'Name' },
  { field: 'annual', label: 'Annual amount', valueGetter: row => row.amount * 12 }];
export default function Example() { return <DynamicTable headers={headers} data={rows} searchByText />; }
