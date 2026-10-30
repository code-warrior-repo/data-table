'use client';
import { useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const [message, setMessage] = useState('The first column contains controls.');
  const columns = [{ id: 'controls', label: 'Controls', type: 'display',
    renderCell: ({ row }) => <Button onClick={() => setMessage(`Selected ${row.name}`)}>Select</Button> }, ...headers];
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <DynamicTable headers={columns} data={rows} enableColumnFilters />
  </Stack>;
}
