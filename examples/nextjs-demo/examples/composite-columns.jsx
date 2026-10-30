'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows } from './shared';
const headers = [{ field: 'fullName', label: 'Full name', fields: ['name', 'surname'], separator: ' ' },
  { field: 'statusLabel', label: 'Status and score', fields: ['status', 'score'], separator: ' (', suffix: ')' }];
export default function Example() { return <DynamicTable headers={headers} data={rows} />; }
