'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows } from './shared';
const headers = [{ field: 'name', label: 'Customer', exportValue: row => `${row.name} ${row.surname}` },
  { field: 'amount', label: 'Amount', exportValue: row => `USD ${row.amount.toFixed(2)}` },
  { field: 'email', label: 'Email (not exported)', enableExport: false }];
export default function Example() { return <DynamicTable headers={headers} data={rows} enableExport />; }
