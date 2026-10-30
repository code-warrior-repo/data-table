'use client';
import { DynamicTable } from '@company/mui-data-table';
import { Chip } from '@mui/material';
import { rows } from './shared';
const headers = [{ field: 'name', label: 'Name' },
  { field: 'status', label: 'Status', renderCell: ({ value }) => <Chip label={value} color={value === 'Active' ? 'success' : 'default'} /> },
  { field: 'amount', label: 'Amount', align: 'right', renderCell: ({ value }) => `$${value.toFixed(2)}` }];
export default function Example() { return <DynamicTable headers={headers} data={rows} />; }
