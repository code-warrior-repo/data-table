'use client';
import { DynamicTable } from '@company/mui-data-table';
const data = [{ id: 1, started: '2026-10-29', reviewed: new Date(2026, 9, 30) }];
const headers = [{ field: 'started', label: 'Started', dateFormat: 'MM/dd/yyyy' },
  { field: 'reviewed', label: 'Reviewed', dateFormat: 'dd MMM yyyy' }];
export default function Example() { return <DynamicTable headers={headers} data={data} />; }
